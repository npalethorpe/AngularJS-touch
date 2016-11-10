app.directive('fTouch', function () {
    
    // Touch event. Throws a callback for the required event
    /*
        Because I've already forgotten once...
        A Press event fires whilst a touch is still on going, a tap event fires when the touch has ended
    */
    var onTouchEvent = function(obj, scope, onTouchStart, onShortPress, onLongPress, onTap, onLongTap, onMove, onPinch, onSwipeLeft, onSwipeRight, onSlidingX, onSlidingY, onTouchEndNoDrag, onTouchEnd){
        var $window = $(window);
        var $startX = 0;
        var $startY = 0;
        var $startTime;
        var $shortPressInterval;
        var $longPressInterval;
        var $distance = 0;
        var $allowedDistance = $window.width() * 0.01;
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
        var $swipeDistQualifier = $window.width() * 0.2;
        var $swipeTimeQualifier = 300;
        var $slideDirection = -1; // -1=none 0=up 1=right 2=down 3=left
        var jObj;
        
        // Check that obj is not undefined
        if (obj !== undefined) {
        
            // Before we do anything make sure we remove any existing handlers attached to this object
            clearClickEvents(obj);
            
            // Setup a JQuery object
            jObj = $(obj);
            
            // Add event listeners
            jObj.on($touchstart_key, function (e) {
                console.log('TOUCH_DIR: Function Touch Start');
                
                // Reset the flags
                $hasDragged = false;
                $isCancelled = false;
                $hasEnded = false;
                
                // Clear the timers
                clearTimeout($shortPressInterval);
                clearTimeout($longPressInterval);
                
                // Check we can start a touch
                if (canTouch(jObj, scope)){
                    
                    // Set the start time we touched
                    $startTime = new Date().getTime();
                    
                    // Wait a few milliseconds to confirm we are not trying to start a drag
                    setTimeout(function(){
                        
                        if (!$hasDragged){
                
                            // Add the touch class to the object
                            console.log('DIR_TOUCH: Adding fTouchdown class');
                            jObj.addClass("ftouchdown");
                            
                            // Set an interval timer to fire once when the short press event needs firing
                            $shortPressInterval = setTimeout(function(){
                                // Check we havent already ended
                                if (!$isCancelled && !$hasDragged && !$hasEnded){
                                    onShortPress();
                                }
                            }, $shortTimeQualifier);
                            
                            // Set an interval timer to fire once when the long press event needs firing
                            $longPressInterval = setTimeout(function(){
                                // Check we havent already ended
                                if (!$isCancelled && !$hasDragged && !$hasEnded){
                                    onLongPress();
                                }
                            }, $longTimeQualifier);
                            
                            // Throw the start touch event
                            onTouchStart(e);
                        }
                        
                        // Check if we are pinching
                        if(e.touches.length == 2) {
                            console.log('DIR_TOUCH: Registered Pinch Start');
                            $isPinching = true;
                            
                            // Clear the timers
                            clearTimeout($shortPressInterval);
                            clearTimeout($longPressInterval);
                            
                            // Work out the start pinch distance
                            $pinchStartDist = Math.sqrt(
                                (e.touches[0].pageX-e.touches[1].pageX) * (e.touches[0].pageX-e.touches[1].pageX) +
                                (e.touches[0].pageY-e.touches[1].pageY) * (e.touches[0].pageY-e.touches[1].pageY)
                            );
                            
                        }

                    },80);
                    
                } else {
                    $isCancelled = true;
                    /*e.preventDefault();
                    e.stopPropagation();*/
                }
                    
                // Check if we are supporting touch events (We should)
                $startX = e.pageX || e.originalEvent.pageX || e.originalEvent.targetTouches[0].pageX;
                $startY = e.pageY || e.originalEvent.pageY || e.originalEvent.targetTouches[0].pageY;
                
                // Check if we have a valid touch event
                if ($startX === undefined || $startY === undefined) {
                    // For some reason we havent got back a valid touch event to just throw the callback
                    $startX = -1;
                    $startY = -1;
                    
                    console.log('Touch End (Invalid Start Event)');
                    if (canTouch($(obj), scope)){
                        onTouchEnd(e);
                    } else {
                        $isCancelled = true;
                        /*e.preventDefault();
                        e.stopPropagation();*/
                    }
                }
                
                console.log('Propagation: ' + scope.stopPropagation);
                if (scope.stopPropagation){
                    console.log('DIR_TOUCH: Stopping Propagation');
                    e.stopPropagation();
                    e.preventDefault();
                }
                
            });
            jObj.on($touchmove_key, function (e) {
                onMove(e);
                var dx = -1;
                var dy = -1;
                    
                // Check if we are pinching
                if ($isPinching){
                    console.log('DIR_TOUCH: Moving - Pinch');
                    
                    dx = e.touches[0].pageX - e.touches[1].pageX;
                    dy = e.touches[0].pageY - e.touches[1].pageY;
                    
                    // Keep a record of the last distance
                    $pinchLastDist = Math.sqrt((dx * dx) + (dy * dy));
                    
                    // Work out the difference between the start distance and the new distance
                    console.log('DIR_TOUCH: Pinched: ' + ($pinchLastDist - $pinchStartDist));
                    onPinch($pinchLastDist - $pinchStartDist);
                
                } else {
                    console.log('DIR_TOUCH: Moving - Drag');
                    
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
                            setTimeout(function(){
                                jObj.removeClass("ftouchdown");
                            },100);
                    
                        }
                    
                        // Work out which direction we are dragging
                        // This statement will lock us into a certain two-way direction
                        if($slideDirection == -1){
                    
                            // We havent set a dir yet
                            if (Math.abs(dx) > Math.abs(dy)){
                    
                                // Moving left/right
                                $slideDirection = dx < 0 ? 1 : 3;
                    
                            } else {
                    
                                // Moving up/down
                                $slideDirection = dy < 0 ? 2 : 0;
                    
                            }
                    
                        }
                    
                        // We should be locked into a direction at this point
                        if ($slideDirection == 0 || $slideDirection == 2){
                    
                            // We are locked into up/down sliding
                            $slideDirection = dy < 0 ? 2 : 0;
                    
                            // Throw the sliding Y event
                            console.log('DIR_TOUCH: Touch Dragged (Up/Down) - ' + $slideDirection + ' at ' + dy);
                            onSlidingY(dy);
                    
                        } else if ($slideDirection == 1 || $slideDirection == 3){
                    
                            // We are locked into left/right sliding
                            $slideDirection = dx < 0 ? 1 : 3;
                    
                            // Throw the sliding X event
                            console.log('DIR_TOUCH: Touch Dragged (Left/Right) - ' + $slideDirection + ' at ' + dx);
                            onSlidingX(dx);
                    
                        }
                    
                    }
                }
                    
            });
            jObj.on($touchend_key, function (e) {
                console.log('TOUCH_DIR: Function Touch End');
                
                var $endTime = new Date().getTime();
                
                // Check if we still have an active touch
                if(e.touches.length > 0) {
                    console.log('TOUCH_DIR: Finished Pinch but still have an active touch');
                    $isPinching = false;
                    return;
                }
                    
                // Set flag to show we have ended
                console.log('TOUCH_DIR: Ended Touch');
                $hasEnded = true;
                    
                // Clear the timers
                clearTimeout($shortPressInterval);
                clearTimeout($longPressInterval);
                
                // Only throw  the tap events if we havent dragged
                if ($hasDragged === false && $isCancelled === false) {
                    
                    // Check if we want to throw the end touch
                    if (canTouch(jObj, scope)){
                    
                        // Check if we qualify for a tap event
                        if ($endTime - $startTime < $shortTimeQualifier){
                            onTap();
                        } else if ($endTime - $startTime < $longTimeQualifier){
                            onLongTap();
                        }
                    
                    }
                    
                    // Throw the touch end - no drag event
                    onTouchEndNoDrag();
                    
                } else if ($hasDragged && ($endTime - $startTime) <= $swipeTimeQualifier){
                    
                    // Check to see if we have qualified for a swipe action
                    if ($distance >= $swipeDistQualifier){
                    
                        // Did we swipe left or right
                        if($slideDirection == 1){
                            console.log('TOUCH_DIR: Swiped Right');
                            onSwipeRight();
                        } else if ($slideDirection == 3){
                            console.log('TOUCH_DIR: Swiped Left');
                            onSwipeLeft();
                        }
                    
                    }
                
                }
                
                // Clear the slide direction
                $slideDirection = -1;
                
                // Remove the touch down class
                setTimeout(function(){
                    jObj.removeClass("ftouchdown");
                }, 100);
                    
                // Always throw the end event
                onTouchEnd(e);
                    
                console.log('Propagation (end): ' + scope.stopPropagation);
                if (scope.stopPropagation){
                    console.log('DIR_TOUCH: Stopping Propagation');
                    e.stopPropagation();
                    e.preventDefault();
                }
                
                // Prevent default action
                /*e.preventDefault();
                e.stopPropagation();*/
                    
            });
            jObj.click(function(e){
                e.preventDefault();
            });
        }
    };


    // Clear On Click Events from the given object
    var clearClickEvents = function(Obj){
        // Check that obj is not undefined
        if (Obj !== undefined) {
            $(Obj).off();
            $(Obj).unbind();
        }
    };


    // Function to determine if a touch event should fire or not
    var canTouch = function(obj, scope){
        // Optionally carry out some logic here to work out if we can action the touch event or not
        return true;
    };

    return {
        restrict: 'A',
        scope: {
            stopPropagation:'=?stoppropagation',
            onTouchstart:'&fTouchstart',
            onShortpress:'&fShortpress',
            onLongpress:'&fLongpress',
            onTap:'&fTap',
            onLongtap:'&fLongtap',
            onMove:'&fMove',
            onPinch:'&fPinch',
            onSwipeleft:'&fSwipeleft',
            onSwiperight:'&fSwiperight',
            onSlidingx:'&fSlidingx',
            onSlidingy:'&fSlidingy',
            onTouchendnodrag:'&fTouchendnodrag',
            onTouchend:'&fTouchend'
        },
        link: function ($scope, $elm, $attr) {
            
            // Add the touch event
            onTouchEvent($elm, $scope, function(e){
                // Touch Start Event
                $scope.onTouchstart({e:e});
            }, function(e){
                // Short Press Event
                $scope.onShortpress({e:e});
            }, function(e){
                // Long Press Event
                $scope.onLongpress({e:e});
            }, function(e){
                // Tap Event
                $scope.onTap({e:e});
            }, function(e){
                // Long Tap Event
                $scope.onLongtap({e:e});
            }, function(e){
                // Move Event
                $scope.onMove({e:e});
            }, function(e){
                // Pinch Event
                $scope.onPinch({e:e});
            }, function(e){
                // Swipe Left Event
                $scope.onSwipeleft({e:e});
            }, function(e){
                // Swipe Right Event
                $scope.onSwiperight({e:e});
            }, function(e){
                // Sliding X Event
                $scope.onSlidingx({e:e});
            }, function(e){
                // Sliding Y Event
                $scope.onSlidingy({e:e});
            }, function(e){
                // Touch End - No Drag Event
                $scope.onTouchendnodrag({e:e});
            }, function(e){
                // Touch End Event
                $scope.onTouchend({e:e});
            });
            
        }
    };
});





