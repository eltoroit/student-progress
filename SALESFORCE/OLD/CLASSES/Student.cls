public without sharing class Attendee {
	@AuraEnabled(cacheable=true)
	public static List<Delivery__c> getActiveDeliveries() {
		// List<Delivery__c> output = new List<Delivery__c>();

		// output = [
		// 	SELECT Id, Name, CurrentExercise__r.Name, Instructor__c
		// 	FROM Delivery__c
		// 	WHERE Id IN (SELECT Delivery__c FROM Course_X_Delivery__c) AND IsActive__c = TRUE
		// 	ORDER BY Name ASC
		// ];

		// return output;
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static List<Attendee__c> getAttendeesForDelivery(String deliveryId) {
		// List<Attendee__c> output = new List<Attendee__c>();

		// // System.debug(deliveryId);
		// // output = [SELECT Id, Name FROM Attendee__c WHERE Delivery__c = :deliveryId ORDER BY Name ASC];

		// return output;
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static Attendee__c getAttendeeById(String attendeeId) {
		// Attendee__c output = new Attendee__c();

		// System.debug(attendeeId);
		// output = [SELECT Id, Name FROM Attendee__c WHERE Id = :attendeeId];

		// return output;
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static Delivery__c getDeliveryById(String deliveryId, Integer forceRefresh) {
		// Delivery__c output = new Delivery__c();

		// System.debug(deliveryId);
		// output = [
		// 	SELECT Id, Name, Instructor__c, CurrentExercise__r.Name, CurrentExerciseIsActive__c
		// 	FROM Delivery__c
		// 	WHERE Id = :deliveryId
		// ];

		// return output;
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static Exercise__c getExercisetById(String exerciseId) {
		// Exercise__c output = new Exercise__c();

		// System.debug(exerciseId);
		// output = [SELECT Id, Name FROM Exercise__c WHERE Id = :exerciseId];

		// return output;
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static Exercise__c getActiveExercise(String deliveryId) {
		// Exercise__c output = null;

		// System.debug(deliveryId);
		// List<Exercise__c> exercises = [
		// 	SELECT Id, Name
		// 	FROM Exercise__c
		// 	WHERE
		// 		Id IN (
		// 			SELECT CurrentExercise__c
		// 			FROM Delivery__c
		// 			WHERE Id = :deliveryId AND CurrentExerciseIsActive__c = TRUE
		// 		)
		// ];
		// if (exercises.size() == 1) {
		// 	output = exercises[0];
		// }

		// return output;
		return null;
	}

	@AuraEnabled
	public static Attendee__c registerAttendee(String deliveryId, String attendeeName) {
		// Attendee__c attendee = new Attendee__c();

		// System.debug(deliveryId);
		// System.debug(attendeeName);
		// attendee = new Attendee__c(Name = attendeeName, delivery__c = deliveryId, Key__c = deliveryId + '|' + attendeeName);
		// upsert attendee Key__c;

		// return attendee;
		return null;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String, Object> validateRegistration(String deliveryId, String attendeeId) {
		// Map<String, Object> output = new Map<String, Object>();
		// List<String> errors = new List<String>();

		// System.debug(deliveryId);
		// System.debug(attendeeId);

		// output.put('attendee', '');
		// output.put('delivery', '');
		// List<Attendee__c> attendees = [SELECT Id, Name FROM Attendee__c WHERE Id = :attendeeId AND Delivery__c = :deliveryId];
		// if (attendees.size() == 1) {
		// 	output.put('attendee', attendees[0]);
		// } else {
		// 	errors.add('Invalid attendeeId');
		// }
		// List<Delivery__c> deliveries = [SELECT Id, Name FROM Delivery__c WHERE Id = :deliveryId AND IsActive__c = TRUE];
		// if (deliveries.size() == 1) {
		// 	output.put('delivery', deliveries[0]);
		// } else {
		// 	errors.add('Invalid deliveryId');
		// }
		// if (errors.size() > 0) {
		// 	throw new CalloutException('Registration data is not valid: ' + JSON.serialize(errors));
		// }

		// return output;
		return null;
	}

	@AuraEnabled
	public static void updateStatus(String exerciseId, String attendeeId, String status) {
		// System.debug(exerciseId);
		// System.debug(attendeeId);
		// System.debug(status);
		// List<Exercise_X_Attendee__c> ExAs = [
		// 	SELECT Id, Name, Exercise__c, Attendee__c, Status__c
		// 	FROM Exercise_X_Attendee__c
		// 	WHERE Attendee__c = :attendeeId AND Exercise__c = :exerciseId
		// ];
		// // This code could be removed later... :-)
		// // START
		// switch on status {
		// 	when 'DONE' {
		// 		status = '03-DONE';
		// 	}
		// 	when 'WORKING' {
		// 		status = '01-WORKING';
		// 	}
		// 	when 'LATER' {
		// 		status = '02-LATER';
		// 	}
		// 	when 'START' {
		// 		status = '00-START';
		// 	}
		// 	when else {
		// 		//
		// 	}
		// }
		// // END
		// Exercise_X_Attendee__c ExA;
		// if (ExAs.size() == 0) {
		// 	ExA = new Exercise_X_Attendee__c(Exercise__c = exerciseId, Attendee__c = attendeeId);
		// } else if (ExAs.size() == 1) {
		// 	ExA = ExAs[0];
		// } else {
		// 	throw new AuraException('Multiple records per attendee');
		// }
		// ExA.Status__c = status;
		// upsert ExA;
	}
}
