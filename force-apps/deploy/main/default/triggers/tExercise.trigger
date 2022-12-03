trigger tExercise on Exercise__c(before update) {
    /*
    for (Exercise__c newEx : Trigger.new) {
        Exercise__c oldEx = Trigger.oldMap.get(newEx.Id)
        ;
        if (oldEx.IsActive__c != newEx.IsActive__c) {
            if (newEx.IsActive__c) {
                // Activated
                newEx.Start__c = Datetime.now();
            } else {
                // De-activated
                newEx.End__c = Datetime.now();
            }
        }
    }
    */
}