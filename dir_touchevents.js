app.directive('fTouch', ['$window', '$timeout', function ($window, $timeout) {
    return {
        restrict: 'A',
        scope: {
            stopPropagation: '=?stoppropagation',
            triggeredTaps: '=?triggeredtaps',
            onTouchstart: '&fTouchstart',
            onShortpress: '&fShortpress',
            onLongpress: '&fLongpress',
            onTap: '&fTap',
            onLongtap: '&fLongtap',
            onMove: '&fMove',
            onPinch: '&fPinch',
            onSwipeleft: '&fSwipeleft',
            onSwiperight: '&fSwiperight',
            onSlidingx: '&fSlidingx',
            onSlidingy: '&fSlidingy',
            onTouchendnodrag: '&fTouchendnodrag',
            onTouchend: '&fTouchend',
            onTriggeredTap: '&fTriggeredtap'
        },
        link: function ($scope, $elm, $attr) {
            var LOG_TAG = 'TOUCH_DIR: ';
            var $startX = 0;
            var $startY = 0;
            var $startTime;
            var $shortPressInterval;
            var $longPressInterval;
            var $distance = 0;
            var $allowedDistance = $window.innerWidth * 0.05;
            var $hasDragged = false;
            var $hasEnded = false;
            var $isPinching = false;
            var $pinchStartDist = 0;
            var $pinchLastDist = 0;
            var $touchstart_key = ('ontouchstart' in window ? 'touchstart' : window.navigator.pointerEnabled ? 'pointerdown' : window.navigator.msPointerEnabled ? 'MSPointerDown' : 'click');
            var $touchend_key = ('ontouchend' in window ? 'touchend' : window.navigator.pointerEnabled ? 'pointerup' : window.navigator.msPointerEnabled ? 'MSPointerUp' : '');
            var $touchmove_key = ('ontouchmove' in window ? 'touchmove' : window.navigator.pointerEnabled ? 'pointermove' : window.navigator.msPointerEnabled ? 'MSPointerMove' : '');
            var $isCancelled = false;
            var $shortTimeQualifier = 500;
            var $longTimeQualifier = 2000;
            var $swipeDistQualifier = $window.innerWidth * 0.2;
            var $swipeTimeQualifier = 300;
            var $slideDirection = -1; // -1=none 0=up 1=right 2=down 3=left
            var $tapCount = 0;
            var $lastTapTicks = 0;
            
            // Clear On Click Events from the given object
            var clearClickEvents = function (Obj) {
                console.log(LOG_TAG + 'Clearing all attached events');
                Obj.off();
                Obj.unbind();
            };
                
            // Cancel any timeouts
            var cancelTimeouts = function(){
                $timeout.cancel($shortPressInterval);
                $timeout.cancel($longPressInterval);
            };
            
            // Before we do anything make sure we remove any existing handlers attached to this object
            clearClickEvents($elm);
 
            // Add event listeners
            $elm.bind($touchstart_key, function (e) {
                console.log(LOG_TAG + 'Touch Start');
 
                // Reset the flags
                $hasDragged = false;
                $isCancelled = false;
                $hasEnded = false;
 
                // Clear the timers
                cancelTimeouts();
 
                // Set the start time we touched
                $startTime = new Date().getTime();
 
                // Add the touch class to the object
                console.log(LOG_TAG + 'Adding fTouchdown class');
                $elm.addClass("ftouchdown");
                
                // Wait a few milliseconds to confirm we are not trying to start a drag
                $timeout(function () {
 
                    if (!$hasDragged) {
 
                        // Set an interval timer to fire once when the short press event needs firing
                        $shortPressInterval = $timeout(function () {
                            // Check we havent already ended
                            if (!$isCancelled && !$hasDragged && !$hasEnded) {
                                $scope.onShortpress({ e: e });
                            }
                        }, $shortTimeQualifier);
 
                        // Set an interval timer to fire once when the long press event needs firing
                        $longPressInterval = $timeout(function () {
                            // Check we havent already ended
                            if (!$isCancelled && !$hasDragged && !$hasEnded) {
                                $scope.onLongpress({ e: e });
                            }
                        }, $longTimeQualifier);
 
                        // Throw the start touch event
                        $scope.onTouchstart({ e: e });
                    }
 
                    // Check if we are pinching
                    if (e.touches.length == 2) {
                        console.log(LOG_TAG + 'Registered Pinch Start');
                        $isPinching = true;
 
                        // Clear the timers
                        cancelTimeouts();
 
                        // Work out the start pinch distance
                        $pinchStartDist = Math.sqrt(
                            (e.touches[0].pageX - e.touches[1].pageX) * (e.touches[0].pageX - e.touches[1].pageX) +
                            (e.touches[0].pageY - e.touches[1].pageY) * (e.touches[0].pageY - e.touches[1].pageY)
                        );
 
                    }
 
                }, 80);
 
                // Check if we are supporting touch events (We should)
                $startX = e.pageX || e.originalEvent.pageX || e.originalEvent.targetTouches[0].pageX;
                $startY = e.pageY || e.originalEvent.pageY || e.originalEvent.targetTouches[0].pageY;
 
                // Check if we have a valid touch event
                if ($startX === undefined || $startY === undefined) {
                    // For some reason we havent got back a valid touch event to just throw the callback
                    $startX = -1;
                    $startY = -1;
 
                    console.log(LOG_TAG + 'Touch End (Invalid Start Event)');
                    $scope.onTouchend({ e: e });
                }
 
                if ($scope.stopPropagation) {
                    console.log(LOG_TAG + 'Stopping Propagation');
                    e.stopPropagation();
                    e.preventDefault();
                }
 
            });
            $elm.bind($touchmove_key, function (e) {
                $scope.onMove({ e: e });
                var dx = -1;
                var dy = -1;
 
                // Check if we are pinching
                if ($isPinching) {
                    
                    // Set our touch coordinates
                    dx = e.touches[0].pageX - e.touches[1].pageX;
                    dy = e.touches[0].pageY - e.touches[1].pageY;
 
                    // Keep a record of the last distance
                    $pinchLastDist = Math.sqrt((dx * dx) + (dy * dy));
 
                    // Work out the difference between the start distance and the new distance
                    console.log(LOG_TAG + 'Pinched: ' + ($pinchLastDist - $pinchStartDist));
                    $scope.onPinch({ e: ($pinchLastDist - $pinchStartDist) });
 
                } else {
                    
                    // Set our touch coordinates
                    dx = $startX - e.touches[0].pageX;
                    dy = $startY - e.touches[0].pageY;
 
                    // Keep a record of how far we have moved
                    $distance = Math.sqrt((dx * dx) + (dy * dy));
                    
                    // Check if the drag distance has passed our allowed distance
                    if ($distance > $allowedDistance) {
                      
                        // These bits will only throw once during the drag
                        if ($hasDragged === false) {
                      
                            // Set a flag to tell us that we've dragged - we no longer want to throw the callback
                            $hasDragged = true;
 
                            // Remove the touch down class
                            $elm.removeClass("ftouchdown");
                      
                        }
                      
                        // Work out which direction we are dragging
                        // This statement will lock us into a certain two-way direction
                        if ($slideDirection == -1) {
                            if (Math.abs(dx) > Math.abs(dy)) {
                                $slideDirection = dx < 0 ? 1 : 3; // left/right
                            } else {
                                $slideDirection = dy < 0 ? 2 : 0; // up/down
                            }
                        }
                      
                        // We should be locked into a direction at this point
                        if ($slideDirection === 0 || $slideDirection == 2) {
                      
                            // We are locked into up/down sliding
                            $slideDirection = dy < 0 ? 2 : 0;
 
                            // Throw the sliding Y event
                            $scope.onSlidingy({ e: dy });
 
                        } else if ($slideDirection == 1 || $slideDirection == 3) {
                      
                            // We are locked into left/right sliding
                            $slideDirection = dx < 0 ? 1 : 3;
 
                            // Throw the sliding X event
                            $scope.onSlidingx({ e: dx });
 
                        }
 
                    }
                }
 
            });
            $elm.bind($touchend_key, function (e) {
                console.log(LOG_TAG + 'Function Touch End');
 
                var $endTime = new Date().getTime();
 
                // Check if we still have an active touch
                if (e.touches.length > 0) {
                    console.log(LOG_TAG + 'Finished Pinch but still have an active touch');
                    $isPinching = false;
                    return;
                }
 
                // Set flag to show we have ended
                $hasEnded = true;
 
                // Clear the timers
                cancelTimeouts();
 
                // Only throw  the tap events if we havent dragged
                if ($hasDragged === false && $isCancelled === false) {
 
                    // Check if we qualify for a tap event
                    if ($endTime - $startTime < $shortTimeQualifier) {
 
                        // Throw the on Tap event
                        $scope.onTap({ e: e });
 
                        // Check if we are looking to trigger a multiple tap event
                        if ($scope.triggeredTaps !== undefined) {
 
                            // Keep a record of how many tap events have occured on this object and clear if
                            // the taps are too far apart
                            if ($lastTapTicks === undefined || (new Date().getTime() - $lastTapTicks) > 800) {
                                console.log(LOG_TAG + 'Clearing down the Tap Count');
                                $tapCount = 0;
                            }
 
                            // Increment the tap count
                            $tapCount++;
                            $lastTapTicks = new Date().getTime();
 
                            // Check if we have reached a point to which we need to throw the triggered tap
                            if ($tapCount >= $scope.triggeredTaps) {
                                $tapCount = 0;
                                $scope.onTriggeredTap({ e: e });
                            }
 
                        }
 
                    } else if ($endTime - $startTime < $longTimeQualifier) {
                        $scope.onLongtap({ e: e });
                    }
 
                    // Throw the touch end - no drag event
                    $scope.onTouchendnodrag({ e: e });
 
                } else if ($hasDragged && ($endTime - $startTime) <= $swipeTimeQualifier) {
                    
                    // Check to see if we have qualified for a swipe action
                    if ($distance >= $swipeDistQualifier) {
                      
                        // Did we swipe left or right
                        if ($slideDirection == 1) {
                            $scope.onSwiperight({ e: e });
                        } else if ($slideDirection == 3) {
                            $scope.onSwipeleft({ e: e });
                        }
 
                    }
 
                }
 
                // Clear the slide direction
                $slideDirection = -1;
 
                // Remove the touch down class
                $elm.removeClass("ftouchdown");
                
                // Always throw the end event
                $scope.onTouchend({ e: e });
                
                if ($scope.stopPropagation) {
                    console.log(LOG_TAG + 'Stopping Propagation');
                    e.stopPropagation();
                    e.preventDefault();
                }
 
            });
            $elm.bind('click', function (e) {
                e.preventDefault();
            });
            
        }
    };
}]);
