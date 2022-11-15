public without sharing class Students {
	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudents() {
		return [SELECT Id, Name FROM Student__c ORDER BY Name ASC];
	}

    @AuraEnabled(cacheable=true)
	public static List<Exercise__c> getExercises() {
		return [SELECT Id, Name, IsActive__c FROM Exercise__c WHERE IsActive__c = true ORDER BY Name ASC];
	}
}
