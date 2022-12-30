List<Attendee__c> ss = new List<Attendee__c>();
List<Delivery__c> ds = [SELECT Id, IsActive__c, (SELECT ID FROM Attendees__r) FROM Delivery__c];
for (Delivery__c d : ds) {
	d.IsActive__c = !d.IsActive__c;
	update d.Attendees__r;
}
update ds;
List<Exercise_X_Attendee__c> ExAs = [SELECT Id FROM Exercise_X_Attendee__c];
update ExAs;
