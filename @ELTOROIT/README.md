# How to improve it?

# TO DO

-   Assign org Ids
    -   Include late registrations
    -   Display URL (login.salesforce.com), username, and password.
        -   Click on any will copy to clipboard
    -   DEX602 only needs the org at the start of the class on Monday
    -   Some private workshops have a combination of courses and the orgs change during the week
-   Store exercise start time
    -   To calculate exercise duration better
    -   Create a special student named "EXERCISE_START" that has no DeliveryId so it can be used on any delivery and have an entry with status "START"
-   Class notes
    -   Export to PDF and email it to students
    -   Include images, and links
    -   Sorted by CreatedDate
-   Delivery could have a field of class location
    -   Company (if private)
    -   City
-   Add a note to the exercise, like "We took a break while doing the exercise"
-   Swap chart to display horizontally, not vertically.
-   Add a timer for breaks
-   Let the instructor connect via phone/tablet
-   Stoping an active exercise should change the time only
    -   Not the lookup to the exercise, currently is set to null
    -   So that we could come back to the exercise even after it has stoped.
        -   Right now, clicking current clears the item from the combo box
-   Exercise should automatically stop when all students are done (or they indicated "LATER")

# DONE

-   Student progress to calculate best student in class
    -   Do not display instructor points
-   Display expected duration
-   On the instrcutor page reporting the particular exercise (for any exercise, even previous ones), be able to change the status of the student
    -   Add a row action to select "DONE, WORKING, LATER" states.
