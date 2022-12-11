# How to improve it?

# TO DO

-   Socket.io!!!!!
-   Assign org Ids
    -   Include late registrations
    -   Display URL (login.salesforce.com), username, and password.
        -   Click on any will copy to clipboard
    -   DEX602 only needs the org at the start of the class on Monday
    -   Some private workshops have a combination of courses and the orgs change during the week
-   Class notes
    -   Export to PDF and email it to students
    -   Include images, and links
    -   Sorted by CreatedDate
    -   Add a note to the exercise, like "We took a break while doing the exercise"
-   Delivery could have a field of class location
    -   Company (if private)
    -   City
-   Add a timer for breaks
    -   Steal the clock from THCM
-   Exercise should automatically stop when all students are done (or they indicated "LATER")
-   Display the time it took an student to complete the exercise

# TEST THIS WHEN I GET INTERNET

-   Activating an exercise is based on a field on the delivery.
    -   The current exercise field does not change until an exercise is started
    -   This affect the instructor view and the student view
    -   I also fixed the initialization, so it should consistently load the value for the instructor panel
-   Store exercise start time to calculate exercise duration better
    -   When you activate a class, create all the students (who have not been created) with a "START" status, then the students can change that to "DONE", "WORKING", or "LATER"
    -   We can find out how long a student took to complete the exercise by diff of CreatedData and LastModiedDate
-   Stoping an active exercise should change the time only
    -   Not the lookup to the exercise, currently is set to null
    -   So that we could come back to the exercise even after it has stoped.
        -   Right now, clicking current clears the item from the combo box and it has to be found manually. It would be just esier to go to the next exercise if we do not forget which one is the crrent one.
-   Let the instructor connect via phone/tablet
    -   Salesforce App
    -   Needs to activate an exercise

# DONE

-   Student progress to calculate best student in class
    -   Do not display instructor points
    -   Swap chart to display horizontally, not vertically.
-   Display expected duration
-   On the instrcutor page reporting the particular exercise (for any exercise, even previous ones), be able to change the status of the student
    -   Add a row action to select "DONE, WORKING, LATER" states.
