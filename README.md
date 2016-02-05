# JSPM on Rails

This is a bed test project to propose a way to structure a Ruby on Rails app that uses JSPM. There may be several other ways to do it and this is one of them. The main purpose is to provide a simple way to do this without having to launch another server or run a compilation watcher process, which is the main advantage of JSPM.

## How to Run it?

Before everything, be sure that you have the next dependencies:

- Ruby and Bundle
- NodeJS
- JSPM (`npm install -g jspm`)

To run this project, you have to clone it first. If you do the typical Rails process:

```bash
$ bundle install
$ rake db:create db:migrate
$ rails s
$ open http://localhost:3000
```

You will find the following error:

```
couldn't find file 'jspm_packages/system.js' with type 'application/javascript'
```

That's because we don't have the JSPM dependencies installed yet and we don't embed them in the repository. To get the jspm dependencies, we only have to do this:

```bash
$ jspm install
```

After the installation, you will find an angular application running there. Yay!

## How to develop here?

First, where do you have to put your code? I tried to put it inside `app/assets/javascripts` but it got fastly weird. Why? Because Sprockets (that little thing behind the Rails Asset Pipeline) doesn't serve the files as they are, but it serves them with the name changed. Additionally, it serves them with a url kind of different from the path where the file is. I could try to fight against this and try to change the Sprockets behavior with the naming and configure how JSPM should ask for everything, but it seemed hacky. What JSPM needs is just the equivalent of a static served folder and nothing anymore.

So, i put everything inside `public/`. Rails serves those files without any change and directly so i think it was the simpler solution. It has, of course, some drawbacks:

1. We are not accostumed to work with `public` instead of `app/assets/javascripts`: I quickly dismissed this because i found that the path i had to search for in the project structure was shorter and easy to find if the file is not so deep.

2. I was somehow breaking the convention of rails about using the app folder for all the behavior of the application. I dismissed it because it was unpractical. This little change - using the public folder - simplified a lot our setup and kept the JSPM configuration more normal and similar to the ones we can find on the internet. We don't have to make something hacky and unstable just to be loyal to an idea.

3. What? You are making public a lot of stuff! This was the first thing that made me worry a bit but these files in public are files that will be served anyway in production, only minified and bundled.

4. If you serve a file from here in production, you will have caching issues because you won't have the name signature Sprockets uses in all the JS files: This is a real problem, but it can be solved by putting the JSPM production bundle in the `app/assets` folder. Remember: In JSPM, the production and development workflows are differently optimized.

Well, after fighting mentally with this drawbacks and deciding that keeping this simple was more important than other issues, all our client side code went to `public`. Inside `public` you can find the following stuff:

- `jspm_packages`: Here is where all the jspm dependencies will be installed.
- `config.js`: The JSPM configuration file. Look at it as a combination of a `Gemfile` with his `Gemfile.lock`.
- `app`: The folder where real code is.

In `app` there's a `bootstrap.ts` file (written is Typescript) that is the starting point of the app. It has some ES6 `import`s there, basically:

```js
import "./app";
import "./controllers/person-controller"
```

Anyway, how are this file served? Let's return to the Rails world for a bit: Go to `app/views/layouts/application.html.erb`. You can find something like this:

```html
<%= javascript_include_tag "/jspm_packages/system.js" %>
<%= javascript_include_tag "/config.js" %>
<script type="text/javascript">
  System.import("app/bootstrap");
</script>
```

So, we are just importing the `bootstrap` module after loading System.js from `public`. This is all the Rails code we will see for a while.

After that, `bootstrap.ts` will be inside the JSPM and ES6 world until the end of times: Everything it imports will be from a jspm package or a file loaded by System.js. Let'ts make something:

First, open the `public/app/bootstrap.ts` file:

```js
import "./app";
import "./controllers/person-controller"

// we will add this
import sum from "./sum"

alert(sum(4, 6, 10))
```

And create the `sum` module:

```js
import reduce from "lodash/reduce";

export default function sum(numbers...) {
  return reduce(numbers, (total, number) => total + number);
}
```

Before running it, we need to install `lodash` with jspm: `jspm i lodash`. That's all.

Now, you will be able to see an alert in your page. This means that everything worked :).

## How this setup works on production?

Because the process of bundling with JSPM can take many lines and each project can need a different set of options, we are using `gulp` to expose a common command for our deployment tool: `gulp build`. To be able to run it in development (if you want to test it locally), you will need to install the dependencies inside the `package.json` file: `npm install`.

After installing the dependencies, just run: `gulp build` and it will generate a `build.js` file inside `app/assets/javascripts/`. This file will be included before importing the initial module in any environment that sets the following Rails configuration (as it is in `production.rb`):

```ruby
config.x.client_side.use_production_build = false
```

And because the `build` is included before the initial `import`, System.js won't attempt to load the modules vía AJAX but it will use the preloaded ones. And this is all. This will allow us to use JSPM on our development environment and use the caching power of sprockets in production.
