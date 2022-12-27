trigger tExercise_X_Student on Exercise_X_Student__c(after insert, after update, after delete) {
	StudentNotifier.publishEvents('Exercise_X_Student__c');
}
