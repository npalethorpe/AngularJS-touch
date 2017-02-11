# AngularJS-touch
This directive provides a light-weight and quick code base to which you can use to add a multitude of touch events to an element within AngularJS. The reason I decided to build my own rather than using existing versions is because I felt that all existing directives were either way too heavy, didn't work most of the time or were missing some, what I deem as, core touch events. So I built the following and hopefully it'll come in usefull to someone else.

I've also included a minified version (Keep an eye on the date to make sure it matches that of the un-minified version).

The general basis of how this works is that you add a f-touch attribute onto your element, along with whatever touch actions you are wanting to capture.

Descriptions:
This directive currently provides access to 13 touch events. They are as follows:

1. onTouchstart
  * The touch start function will always be thrown and signifys the start of the touch
2. onShortpress
  * The short press will fire if the touch has not ended within 500ms of starting
3. onLongpress
  * Very similar to the short press however this will fire after 2 seconds
4. onTap
  * OnTap event will fire if a onTouchEnd is caught within 500ms of a touch start
5. onLongtap
  * OnLongTap event will fire if the onTap hasn't fired and a onTouchEnd is caught within 2 seconds of the touch start
6. onMove
  * OnMove will fire constantly during a drag
7. onPinch
  * The OnPinch event works on a two finger basis and will provide you with the distance between the fingers
8. onSwipeleft
  * The onSwipeLeft will fire if a move left is detected that has travelled atleast a distance of 20% of the window within 300 milliseconds
9. onSwipeRight
  * Works much like the onSwipeLeft action, only swiping right instead
10. onSlidingx
  * This detects a movement in the X coordinate and will lock the movement into X only so the onSlidingY will not be fired whilst this event is.The event will give you the distance travelled.
11. onSlidingy
  * This detects a movement in the Y coordinate and much like the onSlidingX event; this event will lock into the y coordinate until an onEnd event is fired.
12. onTouchendnodrag
  * This is ideal for applying to buttons and will fire on a touch end (regardless of length of touch) only if the touch hasnt dragged further than 1% of the window width.
13. onTouchend
  * The touch end event will trigger on all calls when the touch has ended

How to use:

Copy the script into your project.
Link the script with (using the correct directory structure to your project)
```html
<script type="text/javascript" src="js/directives/dir_touchevents.js"></script>
```

Rename the ``app.directive('fTouch', function() { `` line  to read ``[yourappname].directive...``

Then simply add the  ''f-touch'' attribute to your element as below:

```html
// Handling a basic touch end situation (whilst ignoring drag)
<div f-touch f-touchendnodrag="onActionFunction()"></div>

// To avoid propagation add the stopPropagation attribute to your element as well
<div f-touch f-touchendnodrag="onActionFunction()" stopPropagation="true"></div>
```


