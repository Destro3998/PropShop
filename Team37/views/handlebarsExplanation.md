# Handlebars

**This file should get you familiar with the basics of handlebars**

## Why are we using handlebars?

We are using handlebars because it makes passing variables to our frontend easier than what can be done with only html.
Handlebars isn't the only option for such a task but from the options it seems to have the more palatable syntax.
(Other options: pug (jade), ejs, Mustache. Nunjucks)

for bigger projects a front end framework would be used instead. Frameworks like React, Vue and Angular would probably
be more robust options than what we are using at the moment.

## Syntax

### Passing in variables

To pass a variable in from your server place teh variable name in double curly braces.

javaScript file

```js
let variable = 5
app.route("/", {variable: variable});
```

.handlebars file

```handlebars
<p>{{variable}}</p>>
```

Output

```html
<p>5</p>
```

### if statements

There is an opening tag an else tag and a closing tag

```handlebars
{{#if expression }}
    <!--SOME VALID HTML-->
{{else}}
    <!--SOME VALID HTML-->
{{/if}}
```

### Unless statements

These statements work semantically like inverted if statements.

eg.

```js
if (!(expression)) {
	// do something
}
```

handlebars

```handlebars
{{#unless expression}}
    <!--SOME VALID HTML-->
{{/unless}}
```
