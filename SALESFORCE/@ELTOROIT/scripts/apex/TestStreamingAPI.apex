List<Student__c> ss = new List<Student__c>();
List<Delivery__c> ds = [SELECT Id, IsActive__c, (SELECT ID FROM Students__r) FROM Delivery__c];
for (Delivery__c d : ds) {
	d.IsActive__c = !d.IsActive__c;
	update d.Students__r;
}
update ds;
List<Exercise_X_Student__c> ExSs = [SELECT Id FROM Exercise_X_Student__c];
update ExSs;
