# Heroku

-   Export config vars
    `heroku config --app=th-attendee-reporting-staging --shell`
-   Import config vars
    `heroku config:set --app=th-attendee-reporting-bug VAR=VALUE`
-   Copy from app to app
    `heroku config:set $(heroku config -s -a [source-app] |grep -v '^HEROKU_') -a [destination-app]`
    `heroku config:set $(heroku config -s -a th-attendee-reporting-staging |grep -v '^HEROKU_') -a th-attendee-reporting-bug`
-   Enable Heroku Labs config vars
    `heroku labs:enable runtime-dyno-metadata -a th-attendee-reporting-bug`

# TO DO

-   Add Survey link for the delivery
-   Add a timer for breaks
    -   Steal the clock from THCM
        -   https://git.soma.salesforce.com/aperez/THCM/tree/master/Salesforce/force-apps/deploy/main/default/lwc
    -   Show clock with classroom time
-   Points
    -   Do not give points for 1st, 2nd, 3rd
        -   Assuing 15 students: 15, 14, 13, 12, 11, 10, ...
    -   Instead divide the class in groups
        -   3 groups
            -   Assuming 20 students: (1-7)(8-14)(15-20)
            -   Assuming 15 students: (1-5)(6-10)(11-15)
            -   Assuming 10 students: (1-3)(4-6)(7-10)
        -   Give points per group (3, 2, 1)
    -   This will allow to be more competitive
-   Class notes
    -   Export to PDF and email it to attendees
    -   Include images, and links
    -   Sorted by CreatedDate
    -   Add a note to the exercise, like "We took a break while doing the exercise"
-   Make an option to call attendance
-   Revisit Socket.io events
    -   There is a slight delay when the student reports the completion, and the instructor screen being updated.
        -   This could probably ork faster if the student emits a socket to the instructor
        -   Emit events from JavaScript to JavaScript
            -   This will increase speed
            -   Still go get the data for acuracy
            -   Send all the data needed for the UI change in the socket event
            -   Receive the events and then in JavaScript determine if this event is for me, and act on that or just ignore it
    -   Do I really have to refresh the whole screen when anything changes?
        -   Can I be smart and only do what's required when I receive a notification?
    -   Think of adding Socket.io rooms for the deliveryId
-   Add more spinners
-   Exceeding plaform events on large data changes.
    -   25 Attendees, 20 Exercises, 20 classes will exceed the daily limits
    -   Do not use PE to change the status of the exercise, do a callout instead or call the Socket.io directly
-   Let the instructor connect via phone/tablet
    -   Salesforce App
    -   Needs to activate an exercise
    -   Can watch the timer during a break
-   QR code is not being shown consistently
    -   Consider hardcoding the URL when deploying to production
    -   Consider hosting the images in Heroku to avoid Static Resources, but do this once Heroku is in production

# DONE

-   Activating an exercise is based on a field on the delivery.
    -   The current exercise field does not change until an exercise is started
    -   This affect the instructor view and the attendee view
    -   I also fixed the initialization, so it should consistently load the value for the instructor panel
-   Store exercise start time to calculate exercise duration better
    -   When you activate a class, create all the attendees (who have not been created) with a "START" status, then the attendees can change that to "DONE", "WORKING", or "LATER"
    -   We can find out how long a attendee took to complete the exercise by diff of CreatedData and LastModiedDate
-   Stoping an active exercise should change the time only
    -   Not the lookup to the exercise, currently is set to null
    -   So that we could come back to the exercise even after it has stoped.
        -   Right now, clicking current clears the item from the combo box and it has to be found manually. It would be just esier to go to the next exercise if we do not forget which one is the crrent one.
-   Attendee progress to calculate best attendee in class
    -   Do not display instructor points
    -   Swap chart to display horizontally, not vertically.
-   Display expected duration
-   On the instrcutor page reporting the particular exercise (for any exercise, even previous ones), be able to change the status of the attendee
    -   Add a row action to select "DONE, WORKING, LATER" states.
-   Socket.io!!!!!
    -   I tired using EmpAPI, but it's not supported on mobile devices.
        -   https://developer.salesforce.com/docs/component-library/bundle/lightning:empApi/documentation
        -   "This component is supported only in desktop browsers."
    -   Child component that fires events when a message is received
    -   @api function to publish events
-   Duplicate attendees
    -   I had two michael attendees in the class. Ask for FirstName and LastName when registering
    -   Also add a "nickname"
-   Display the time it took an attendee to complete the exercise
-   Attendee randomizer
    -   Move the data acquisition to the attendee layer?
    -   Use a modal dialog
-   Delivery could have a field of class location
    -   Company (if private)
    -   City
-   Exercise should automatically stop when all attendees are done (or they indicated "LATER")
-   Assign org Ids
    -   Include late registrations
    -   Display URL (login.salesforce.com), username, and password.
        -   Click on any text will copy to clipboard
    -   DEX602 only needs the org at the start of the class on Monday
    -   Some private workshops have a combination of courses and the orgs change during the week
