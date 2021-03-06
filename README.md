# angular-screenmatch

Simple Angular API for performing screen size related tasks.
- a single resize listener on the window for optimal performance
- ngIf style directive
- bind variables to always reflect screen size
- bind callbacks to fire on screen change
- execute one time tasks like loading data
- create custom rules or extend and use predefined sets
- Bootstrap 3 support

## Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Using the Directive](#using-the-directive)
  - [In a Controller](#in-a-controller)
  - [How resize events are handled](#how-resize-events-are-handled)
- [Configuration](#configuration)
- [API](#api)

## Installation

`bower install angular-screenmatch`

 Or get the minified script from /dist.

```html
<script src='/path/to/your/modules/angular-screenmatch.min.js'></script>
```

The [matchMedia polyfill](https://github.com/paulirish/matchMedia.js/) is included and will be injected automatically into legacy browsers (<IE10)


##### Declare module as a dependency

```javascript
angular.module('yourmodule', ['angular.screenmatch']);
```

##### Inject screenmatch into a Controller

```javascript
angular.controller('YourController', function(screenmatch) {
    screenmatch.once('sm', function () {
        console.log('we logged a match to sm!');
    };
};
```
## Usage

#### Using the Directive

The directive is super easy to use.  Just assign a string that you want it to watch, and it will behave like `ngIf`.

```html
<div asm-screen="md, lg">
    <p>I will only appear on medium and large screens!</p>
</div>
```

#### In a Controller

##### `bind`

Assign a variable to `bind` to get an object that has two properties. The first is `active`, which always reflects the truthiness of the string passed in.

```javascript
$scope.portable = screenmatch.bind('xs, sm', $scope);

$scope.portable.active === true; //true if the screen is xs or sm

if ($scope.portable.active) {
    doStuff();
}
```
The second property is `unbind()` which you can call to stop the variable updating.

```javascript
$scope.portable.unbind(); //now I no longer react to changes!
```

The `$scope` argument that's initially passed in to `bind` is the scope you want to bind a resize listener too.  When that scope is destroyed, the listener will deregister.  You can omit this argument and it will listen on `$rootScope` indefinitely instead, or until you cancel it using `unbind`.

Check out the [section on how resize events are handled](#how-resize-events-are-handled) for more information on listeners.

##### `once`

If you only want to run some code when a screen size is initially matched, execute it in the callback for `once`. This is great for things like loading data from a backend.

```javascript
screenmatch.once('lg', function () {
    myImgService.get(data);
});
```
`once` attempts to find a match on load and if it fails, registers a listener which will check conditions each time the screen resizes.  Whenever a match is found, the callback is executed, and the listener is deregistered.

##### `when`

If you want to run code every time a screen size is matched, execute it in the callback for `when`. Optionally you can pass in a second callback which will execute when the screen size is unmatched again.

```javascript
screenmatch.when('lg', function () {
    runMyAnimations();
}, function () {
    stopMyAnimations()
});
```
On load, a match (or unmatch) will be made, and the appropriate callback will execute. It won't run again unless the truthiness of the match changes - so no need to worry about multiple callbacks firing on every screen resize.

If you need to deregister `when` manually, you can assign it to a variable and then call `cancel()`.
```javascript
var stuff = screenmatch.when('lg', function () {
    doStuff(); //will do stuff every time large gets matched
});

stuff.cancel() // does nothing now
```

##### `is`

If you don't care about resize events and just want to check the screen size on load, you can use `is` for a one time binding.

```javascript
var smallScreen = screenmatch.is('sm, xs');
if (smallScreen) {
    smallSpinnerLoad()
}
```

Just remember that `is` will not update if the screen is resized.

## How resize events are handled
A single event listener is added to `$window` which broadcasts resize events using `$rootScope.$broadcast`.  The broadcast is wrapped in an `$interval` with a configurable debounce setting, to delay firing it when the window resizes.

This prevents having to bind an event listener to `$window` every time a directive is used or an angular binding is made.  Instead, scope is passed as an argument to the screenmatch functions and a listener is registered using `scope.$on`.  The listener will deregister whenever the scope is destroyed.

To create a permanent listener, the `scope` argument can be omitted from any function and it will default to listening on `$rootScope`.  Be careful to unregister any listeners you don't need if you use this feature.

You can hook into the `$broadcast` event anywhere else in your project by registering your own listener.  See the [docs](https://docs.angularjs.org/api/ng/type/$rootScope.Scope#$on) for more info.

```javascript
scope.$on('screenmatch::resize', function () {
    doMyOwnResizeTask()
});
```

The `$window` event listener can be disabled during configuration if you don't want to use it.  Doing this will prevent screenmatch from dynamically updating after the initial load.  <b>It is not recommended</b> unless you only want to calculate the screen size on load.

## Configuration

All of the configuration options are set in the angular module config block by injecting `screenmatchConfigProvider`. If they are not set, the defaults are used.

#### Configure Rules

There are several ways to customise the rules used to match against.

##### Predefined rules.

To use a predefined set of rules, assign a string to `screenmatchConfigProvider.config.rules`.

```javascript
angular.module('yourmodule')
    .config(function(screenmatchConfigProvider) {
        screenmatchConfigProvider.config.rules = 'matchmedia';
    });
```

There are currently two predefined sets, `bootstrap` for Bootstrap 3, or `matchmedia` for matchMedia devices.

```javascript
bootstrap : {
    lg: '(min-width: 1200px)',
    md: '(min-width: 992px) and (max-width: 1199px)',
    sm: '(min-width: 768px) and (max-width: 991px)',
    xs: '(max-width: 767px)'
};

matchmedia : {
    print : 'print',
    screen : 'screen',
    phone : '(max-width: 767px)',
    tablet : '(min-width: 768px) and (max-width: 991px)',
    desktop : '(min-width: 992px)',
    portrait : '(orientation: portrait)',
    landscape : '(orientation: landscape)'
};
```

The default is Bootstrap 3.

##### Custom rules

To use a custom set of rules, assign an object instead.  The values must be strings, to match against CSS media queries.

```javascript
.config(function(screenmatchConfigProvider) {
    screenmatchConfigProvider.config.rules = {
        tiny : '(max-width: 320px)',
        phablet : '(min-width: 321px) and (max-width: 991px)',
        standard : '(min-width: 992px) and (max-width: 1280px)',
        big: '(min-width: 1281px)'
    };
});
```

##### Add rules

If you want to add rules to one of the predefined sets, use `screenmatchConfigProvider.config.extrarules`.
Assign a valid object and the rules will be added to whichever set is in use.

```javascript
.config(function(screenmatchConfigProvider) {
    screenmatchConfigProvider.config.extrarules = {
        //added to default bootstrap set
        xl : '(min-width: 1600px)'
    };
});
```

#### Configure the resize broadcast

##### Debounce

To set the delay between the window resizing and the broadcast, use `screenmatchConfigProvider.config.debounce`.
Assign an int for a delay in ms. The default is 250.

```javascript
.config(function(screenmatchConfigProvider) {
    screenmatchConfigProvider.config.debounce = 500;
});
```

##### Disable the event listener

To disable binding the `$window` resize event listener, and any related functionality, use `screenmatchConfigProvider.config.nobind`.

```javascript
.config(function(screenmatchConfigProvider) {
    screenmatchConfigProvider.config.nobind = true;
});
```

## API

##### `screenmatch.is(string)`
>Checks a list of values for matchmedia truthiness. Only triggers once, on load.
>
>###### argument
>String containing a comma separated list of values to match.
>###### returns
>True if any of the values is a match, else False.

##### `screenmatch.bind(string[, scope])`
>Watches a list of values for matchmedia truthiness.   Returns an object with methods to observe and cancel the watch.
>
>###### arguments
>String containing a comma separated list of values to match.
>
>Scope to register the listener on. Defaults to $rootScope if omitted.
>###### returns
>Object with two properties:
>
>Object.active is True if any of the values is a match, else False.
>
>Object.unbind() to stop listening to resize events.

##### `screenmatch.once(string, callback[, scope])`
>Watches a list of values for matchmedia truthiness.
>Executes a callback when it finds a match, then stops watching. The callback will only execute once.
>
>###### arguments
>String containing a comma separated list of values to watch.
>
>Callback function to execute.
>
>Scope to register the listener on. Defaults to $rootScope if omitted.
>###### returns
>No return value. Callback will only execute on successful match.

##### `screenmatch.when(string, true_callback[, false_callback, scope])`
>Watches a list of values for matchmedia truthiness.  Executes a callback when it finds a match.
>Optionally executes a second callback when it unmatches. Returns an object with method to cancel the watch.
>
>###### arguments
>String containing a comma separated list of values to match.
>
>True Callback to execute on succesful match.
>
>False Callback to execute on unmatch (optional)
>
>Scope to register the listener on. Defaults to $rootScope if omitted.
>###### returns
>Object with one property:
>
>Object.cancel() to stop listening to resize events and stop executing callbacks
>

