# angular-screenmatch
Angular API for matching screen changes with MatchMedia.  Supports custom rulesets as well as Matchmedia and Bootstrap 3 defaults. Also exposes an (optional) window resize event broadcast, with a NgIf style directive.

##Installation

todo

include shiv for legacy support

###Configuration

todo

##Usage

###In a Controller

Assign a variable to `bind` and then update it on callback to always reflect the truthiness of the string passed in.  In the following example, using bootstrap rules, portable will always be True if the screen is xs or sm, else it will be False:

```javascript
var portable = screenmatch.bind('xs, sm', function (match) {
    portable = match;
};
```

You can also use `bind` to conditionally execute other code when the screen size changes.  The callback will execute every time the condition changes (not every time the screen resizes):

```javascript
screenmatch.bind('lg', function(match) {
    if (match) {
        startAnimation()
    } else {
        stopAnimation()
    }
}

```

If you only want to execute some code once, when a screen size is initially matched, execute it in the callback for `once`. This is great for things like loading data from a backend. For example:

```javascript
screenmatch.once('lg', function () {
    myImgService.get(data);
}
```

`once` will attempt to find a match initially and if it fails, register a listener which will check conditions each time the screen resizes.  The listener is unregistered once the callback has executed. 

If you dont care about resize events and just want to check the screen size on load, you can use `is` for a one time binding. For example:

```javascript
var smallScreen = screenmatch.is('sm, xs');
if (smallScreen) {
    smallSpinnerLoad()
}
```

Just remember that `is` will not update if the screen changes size... its often more practical to use either `bind` or `once`.

###Using the Directive

The directive is super easy to use.  Just pass in the string you want it to watch, and it will behave like `ngIf`:

```html
<div asm-screen="md, lg">
    <p>I will only appear on medium and large screens!</p>
<div>
```

You can also hook into the standard `ngIf` animation classes.. behind the scenes it works the same way. 

###How resize events are handled
A single event listener is added to `$window` which broadcasts resize events over `$rootScope`.  This prevents having to bind an event listener every time a directive is used or an angular binding is made.

The broadcast is wrapped in a `$timeout` with a configurable debounce setting, to delay firing it when the window resizes. 

To hook into this broadcast anywhere else in your project, and avoid having to set up your own event listeners, simply do this:

```javascript
$rootScope.$on('matchscreen::resize', function () {
    doMyOwnResizeTask()
});
```

The binding of the event listener can be prevented during configuration if you don't want to use it.  Doing this will prevent `bind` and `once` from dynamically updating after the initial load.  <b>It is not recommended</b> unless you only want to use the `is` method.  Disabling the event listener will also stop the directive updating dynamically.

##API

#####`screenmatch.is(string)`
Checks a list of values for matchmedia truthiness. Only triggers once, on load.

For most use cases, you should probably use `bind()` or `once()` instead.
######argument
String containing a comma separated list of values to match.
######returns
True if any of the values is a match, else False.

#####`screenmatch.bind(string, callback)`
Watches a list of values for matchmedia truthiness.   Executes a callback if the truthiness changes.

######arguments
String containing a comma separated list of values to match. 

Callback function to execute.
######returns
True if any of the values is a match, else False.

Callback also returns True if a match, else False.
 
#####`screenmatch.once(string, callback)`
Watches a list of values for matchmedia truthiness. 
Executes a callback when it finds a match, then stops watching. The callback will only execute once.

######arguments
String containing a comma separated list of values to watch. 
 
Callback function to execute.
######returns
No return value. Callback will only execute on successful match.


####TODO

finish docs

package w/bower

tests

