trigger tStudent on Student__c(after insert, after update, after delete) {
	StudentNotifier.publishEvents('Student__c');
}
