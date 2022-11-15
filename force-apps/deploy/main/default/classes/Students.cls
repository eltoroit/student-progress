public without sharing class Students {
	@AuraEnabled(cacheable=true)
	public static List<Student__c> getStudents() {
		return [SELECT Id, Name FROM Student__c ORDER BY Name ASC];
	}

    @AuraEnabled(cacheable=true)
	public static List<Exercise__c> getActiveExercises() {
		return [SELECT Id, Name, IsActive__c FROM Exercise__c WHERE IsActive__c = true ORDER BY Name ASC];
	}

    @AuraEnabled(cacheable=true)
	public static List<Exercise__c> getAllExercises() {
		return [SELECT Id, Name, IsActive__c FROM Exercise__c ORDER BY Name ASC];
	}

	@AuraEnabled
	public static List<Exercise__c> activateExercise(String Id) {
		List<Exercise__c> activeExercises = getActiveExercises(); 
		for (Exercise__c active: activeExercises) {
			active.IsActive__c = false;
		}
		update activeExercises;
		update new Exercise__c(Id =  Id, IsActive__c = true);
		return getAllExercises();
	}
}
