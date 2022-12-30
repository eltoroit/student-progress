public without sharing class DeliveryTriggerHandler {
	public static void CreateInstructorAsAttendee(List<Delivery__c> triggerNew, Map<Id, Delivery__c> triggerOldMap) {
		List<Attendee__c> attendeesToDelete = new List<Attendee__c>();

		// Cascade delete
		if (Trigger.isDelete) {
			delete [SELECT Id FROM Attendee__c WHERE Delivery__c IN :triggerOldMap.values()];
			return;
		}

		System.assertEquals(true, Trigger.isInsert || Trigger.isUpdate);

		// Only worry about deliveries that are active and have changed instructors
		List<Delivery__c> deliveriesWithInstructorsChange = new List<Delivery__c>();
		for (Delivery__c delivery : triggerNew) {
			if (
				triggerOldMap?.get(delivery.Id)?.IsActive__c != delivery.IsActive__c ||
				triggerOldMap?.get(delivery.Id)?.InstructorLookup__c != delivery.InstructorLookup__c
			) {
				deliveriesWithInstructorsChange.add(delivery);
			}
		}

		// Delete existing instructors
		delete [SELECT Id FROM Attendee__c WHERE Delivery__c IN :deliveriesWithInstructorsChange AND IsInstructor__c = TRUE];

		// Collect instructor master records and their deliveries (if they are active)
		Map<Id, List<Delivery__c>> masterInstructorWithDeliveries = new Map<Id, List<Delivery__c>>();
		for (Delivery__c delivery : deliveriesWithInstructorsChange) {
			if (delivery.IsActive__c) {
				List<Delivery__c> deliveries = new List<Delivery__c>();
				if (masterInstructorWithDeliveries.containsKey(delivery.InstructorLookup__c)) {
					deliveries = masterInstructorWithDeliveries.get(delivery.InstructorLookup__c);
				}
				deliveries.add(delivery);
				masterInstructorWithDeliveries.put(delivery.InstructorLookup__c, deliveries);
			}
		}

		// Find master instructor records
		Map<Id, Attendee__c> masterInstructors = new Map<Id, Attendee__c>(
			[
				SELECT Id, Name, ChosenDTTM__c, Delivery__c, Email__c, FirstName__c, IsInstructor__c, LastName__c, Name__c, Nickname__c
				FROM Attendee__c
				WHERE Id IN :masterInstructorWithDeliveries.keySet()
			]
		);

		// Create new instructors for the active deliveries
		List<Attendee__c> newInstructorAsAttendees = new List<Attendee__c>();
		for (Id masterInstructorId : masterInstructorWithDeliveries.keySet()) {
			for (Delivery__c delivery : masterInstructorWithDeliveries.get(masterInstructorId)) {
				if (delivery.IsActive__c) {
					Boolean preserveId = false;
					Boolean isDeepClone = true;
					Attendee__c newAttendee = masterInstructors.get(masterInstructorId).clone(preserveId, isDeepClone);
					newAttendee.Delivery__c = delivery.Id;
					newAttendee.IsInstructor__c = true;
					newAttendee.RecordTypeId = Schema.SObjectType.Attendee__c.getRecordTypeInfosByName().get('Attendee').getRecordTypeId();
					newInstructorAsAttendees.add(newAttendee);
				}
			}
		}
		insert newInstructorAsAttendees;
	}
}
