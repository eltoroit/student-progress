public without sharing class Data {
	@AuraEnabled
	public static List<Delivery__c> getActiveDeliveries() {
		List<Delivery__c> output = new List<Delivery__c>();

		output = [
			SELECT Id, Name, Instructor__c
			FROM Delivery__c
			WHERE IsActive__c = TRUE
			ORDER BY Name ASC
		];

		return output;
	}

	@AuraEnabled
	public static List<Delivery__c> getActiveDeliveriesWithCourses() {
		List<Delivery__c> output = new List<Delivery__c>();

		output = [
			SELECT Id, Name, Instructor__c, CurrentExercise__r.Name, CurrentExerciseStart__c, CurrentExerciseIsActive__c
			FROM Delivery__c
			WHERE IsActive__c = TRUE AND Id IN (SELECT Delivery__c FROM Course_X_Delivery__c)
			ORDER BY Name ASC
		];

		return output;
	}

	@AuraEnabled
	public static List<Course__c> getCoursesPerDelivery(Id deliveryId) {
		List<Course__c> output = new List<Course__c>();
		List<Course_X_Delivery__c> CxDs = [
			SELECT Id, Name, Course__r.Name
			FROM Course_X_Delivery__c
			WHERE Delivery__r.IsActive__c = TRUE AND Delivery__c = :deliveryId
			ORDER BY Delivery__r.Name ASC, Order__c ASC
		];

		for (Course_X_Delivery__c CxD : CxDs) {
			output.add(CxD.Course__r);
		}

		return output;
	}

	@AuraEnabled
	public static List<Exercise__c> getAllExercisesForCourse(Id courseId) {
		List<Exercise__c> output = new List<Exercise__c>();

		output = [
			SELECT Id, Name, Course__c, Course__r.Name, ExpectedDuration__c, Order__c
			FROM Exercise__c
			WHERE Course__c = :courseId
			ORDER BY Order__c ASC
		];

		return output;
	}

	@AuraEnabled
	public static Map<String, Object> getDeliveryProgress(Id deliveryId) {
		Map<String, Object> output = new Map<String, Object>();

		List<Attendee__c> attendees = [
			SELECT Id, Name, IsInstructor__c
			FROM Attendee__c
			WHERE Delivery__c = :deliveryId
			ORDER BY Name
		];
		List<Exercise__c> exercises = [
			SELECT
				Id,
				Name,
				(
					SELECT ID, Attendee__c, Attendee__r.Name, Status__c, lastModifiedDate
					FROM Exercises_X_Attendees__r
					WHERE Attendee__c IN :attendees
					ORDER BY lastModifiedDate ASC
				)
			FROM Exercise__c
			WHERE
				Id IN (
					SELECT Exercise__c
					FROM Exercise_X_Attendee__c
					WHERE Attendee__r.Delivery__c = :deliveryId
				)
			ORDER BY Name
		];
		output.put('ATTENDEES', attendees);
		output.put('EXERCISES', exercises);

		return output;
	}

	@AuraEnabled
	public static List<Attendee__c> getExerciseProgress(Id deliveryId, Id exerciseId) {
		List<Attendee__c> output = new List<Attendee__c>();

		output = [
			SELECT
				Id,
				Name,
				IsInstructor__c,
				(
					SELECT Id, Status__c, CreatedDate, lastModifiedDate
					FROM Exercises_X_Attendees__r
					WHERE Exercise__c = :exerciseId
				)
			FROM Attendee__c
			WHERE Delivery__c = :deliveryId
			ORDER BY Name ASC
		];

		return output;
	}

	@AuraEnabled
	public static List<Attendee__c> getAttendeesForDelivery(Id deliveryId) {
		List<Attendee__c> output = new List<Attendee__c>();

		output = [
			SELECT Id, Name, FirstName__c, LastName__c, Nickname__c, Email__c
			FROM Attendee__c
			WHERE Delivery__c = :deliveryId
			ORDER BY Name ASC
		];

		return output;
	}

	@AuraEnabled
	public static void startStopExercise(Id deliveryId, String exerciseId, Boolean isStart) {
		try {
			if (isStart) {
				// Update delivery
				Delivery__c delivery = [
					SELECT CurrentExercise__c, CurrentExerciseIsActive__c, CurrentExerciseStart__c
					FROM Delivery__c
					WHERE Id = :deliveryId
				];
				if (delivery.CurrentExercise__c != exerciseId) {
					delivery.CurrentExercise__c = exerciseId;
					delivery.CurrentExerciseStart__c = Datetime.now();
				}
				delivery.CurrentExerciseIsActive__c = true;
				update delivery;

				// Create ExA records
				List<Attendee__c> attendees = [
					SELECT Id, Name
					FROM Attendee__c
					WHERE Delivery__c = :deliveryId
					ORDER BY Name
				];

				List<Exercise_X_Attendee__c> existingExA = [
					SELECT Attendee__c
					FROM Exercise_X_Attendee__c
					WHERE Attendee__r.Delivery__c = :deliveryId AND Exercise__c = :exerciseId
				];

				if (existingExA.size() < attendees.size()) {
					Set<Id> missingAttendeeIds = new Set<Id>();
					for (Attendee__c attendee : attendees) {
						missingAttendeeIds.add(attendee.Id);
					}
					for (Exercise_X_Attendee__c ExA : existingExA) {
						missingAttendeeIds.remove(ExA.Attendee__c);
					}
					if (missingAttendeeIds.size() > 0) {
						List<Exercise_X_Attendee__c> newExA = new List<Exercise_X_Attendee__c>();
						for (Id attendeeId : missingAttendeeIds) {
							newExA.add(new Exercise_X_Attendee__c(Attendee__c = attendeeId, Exercise__c = exerciseId, Status__c = STATES.START));
						}
						insert newExA;
					} else {
						throw new CalloutException('I thought you said we were missing records...');
					}
				} else if (attendees.size() == existingExA.size()) {
					// Good to go
				} else {
					// Why?
					String msg = 'There are [' + existingExA.size() + '] ExA records, but only [' + attendees.size() + '] attendees';
					throw new CalloutException(msg);
				}
			} else {
				update new Delivery__c(Id = deliveryId, CurrentExerciseIsActive__c = false);
			}
		} catch (Exception e) {
			throw new CalloutException(e.getMessage());
		}

		// return [
		// 	SELECT CurrentExercise__r.Name, CurrentExerciseIsActive__c, CurrentExerciseStart__c
		// 	FROM Delivery__c
		// 	WHERE Id = :deliveryId
		// ];
	}

	@AuraEnabled
	public static void updateAttendeeStatus(Id exerciseId, Id attendeeId, String status) {
		List<Exercise_X_Attendee__c> ExAs = [
			SELECT Id, Name, Exercise__c, Attendee__c, Status__c
			FROM Exercise_X_Attendee__c
			WHERE Attendee__c = :attendeeId AND Exercise__c = :exerciseId
		];
		Exercise_X_Attendee__c ExA;
		if (ExAs.size() == 0) {
			ExA = new Exercise_X_Attendee__c(Exercise__c = exerciseId, Attendee__c = attendeeId);
		} else if (ExAs.size() == 1) {
			ExA = ExAs[0];
		} else {
			throw new CalloutException('Multiple records per attendee');
		}
		ExA.Status__c = status;
		upsert ExA;
	}

	@AuraEnabled
	public static Map<String, Object> validateAttendeeRegistration(Id deliveryId, Id attendeeId) {
		Map<String, Object> output = new Map<String, Object>();
		List<String> errors = new List<String>();

		output.put('attendee', '');
		output.put('delivery', '');
		List<Attendee__c> attendees = [SELECT Id, Name FROM Attendee__c WHERE Id = :attendeeId AND Delivery__c = :deliveryId];
		if (attendees.size() == 1) {
			output.put('attendee', attendees[0]);
		} else {
			errors.add('Attendee not found');
		}
		List<Delivery__c> deliveries = [SELECT Id, Name FROM Delivery__c WHERE Id = :deliveryId AND IsActive__c = TRUE];
		if (deliveries.size() == 1) {
			output.put('delivery', deliveries[0]);
		} else {
			errors.add('Delivery not found');
		}
		if (errors.size() > 0) {
			String reason = '';
			if (errors.size() > 2) {
				reason = JSON.serialize(errors);
			} else if (errors.size() > 1) {
				reason = 'Neither attendee nor delivery found';
			} else {
				reason = errors[0];
			}
			throw new CalloutException('[Apex] Registration data is not valid | ' + reason + ' | Please register.');
		}

		return output;
	}

	@AuraEnabled
	public static Attendee__c registerAttendee(Id deliveryId, Attendee__c attendee) {
		upsert attendee;
		return attendee;
	}

	@AuraEnabled
	public static Map<String, Object> getAttendeeDataByAttendeeId(Id attendeeId) {
		Map<String, Object> output = new Map<String, Object>();

		Attendee__c attendee = [
			SELECT Id, Name, FirstName__c, LastName__c, Nickname__c, Email__c, Delivery__c
			FROM Attendee__c
			WHERE Id = :attendeeId
		];

		output.put('attendeeId', attendee.Id);
		output.put('attendee', attendee);

		Delivery__c delivery = [
			SELECT Id, Name, CurrentExercise__c, CurrentExerciseStart__c, CurrentExerciseIsActive__c
			FROM Delivery__c
			WHERE Id = :attendee.Delivery__c
		];

		output.put('deliveryId', delivery.Id);
		output.put('delivery', delivery);

		if (delivery.CurrentExerciseIsActive__c) {
			Exercise__c exercise = [
				SELECT Id, Name
				FROM Exercise__c
				WHERE Id = :delivery.CurrentExercise__c
			];

			output.put('exerciseId', exercise.Id);
			output.put('exercise', exercise);

			Exercise_X_Attendee__c ExA = [
				SELECT Id, Status__c
				FROM Exercise_X_Attendee__c
				WHERE Attendee__c = :attendee.Id AND Exercise__c = :exercise.Id
			];

			output.put('exerciseStatus', ExA.Status__c);
		}

		return output;
	}

	@AuraEnabled
	public static Attendee__c pickRandomAttendee(Id deliveryId) {
		Attendee__c output = new Attendee__c();

		// Find al attendees for the delivery
		List<Attendee__c> attendees = [
			SELECT Id, Name, FirstName__c, LastName__c, Nickname__c, Email__c, ChosenDTTM__c
			FROM Attendee__c
			WHERE Delivery__c = :deliveryId AND IsInstructor__c = FALSE
			ORDER BY ChosenDTTM__c ASC
		];

		// Randomly pick a attendee who has not been chosen on a while
		Double dRandomIndex = Math.random() * (attendees.size() / 2);
		dRandomIndex = Math.floor(dRandomIndex);
		Integer iRandomIndex = Integer.valueOf(dRandomIndex);
		output = attendees[iRandomIndex];

		// Update timestamp, so it's not chosen soon
		output.ChosenDTTM__c = Datetime.now();
		update output;

		return output;
	}

	// // Other
	// @AuraEnabled(cacheable=true)
	// public static Exercise__c getActiveExercise(Id deliveryId) {
	// 	Exercise__c output = null;

	// 	List<Exercise__c> exercises = [
	// 		SELECT Id, Name
	// 		FROM Exercise__c
	// 		WHERE
	// 			Id IN (
	// 				SELECT CurrentExercise__c
	// 				FROM Delivery__c
	// 				WHERE Id = :deliveryId AND CurrentExerciseIsActive__c = TRUE
	// 			)
	// 	];
	// 	if (exercises.size() == 1) {
	// 		output = exercises[0];
	// 	}

	// 	return output;
	// }

	// @AuraEnabled(cacheable=true)
	// public static Delivery__c getDeliveryById(Id deliveryId) {
	// 	Delivery__c output = new Delivery__c();

	// 	output = [
	// 		SELECT Id, Name, Instructor__c, CurrentExercise__r.Name, CurrentExerciseIsActive__c
	// 		FROM Delivery__c
	// 		WHERE Id = :deliveryId
	// 	];

	// 	return output;
	// }

	// @AuraEnabled(cacheable=true)
	// public static Exercise__c getExercisetById(Id exerciseId) {
	// 	Exercise__c output = new Exercise__c();

	// 	output = [SELECT Id, Name FROM Exercise__c WHERE Id = :exerciseId];

	// 	return output;
	// }
}
