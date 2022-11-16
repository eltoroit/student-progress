delete [SELECT Id FROM Exercise_X_Student__c];
List<Exercise__c> exs = [SELECT Id, IsActive__c FROM Exercise__c WHERE IsActive__c = TRUE];
for (Exercise__c ex : exs) {
	ex.IsActive__c = false;
}
update exs;
