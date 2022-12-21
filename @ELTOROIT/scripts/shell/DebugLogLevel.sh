# Create the DebugLevel
sfdx force:data:record:create --sobjecttype DebugLevel --values "DeveloperName='FINEST' MasterLabel='FINEST' ApexCode='FINEST' ApexProfiling='FINEST' Callout='FINEST' Database='FINEST' Nba='FINEST' System='FINEST' Validation='FINEST' Visualforce='FINEST' Wave='FINEST' Workflow='FINEST'" --usetoolingapi --json
# https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_debuglevel.htm
# Represents a set of log category levels to assign to a TraceFlag object. Multiple trace flags can use a debug level.
# System.debug(
#     [
#         SELECT Id, DeveloperName, Language, MasterLabel, ApexCode, ApexProfiling, Callout, Database, Nba, System, Validation, Visualforce, Wave, Workflow
# 		FROM DebugLevel
# 	]
# );

# Create the entry for user (much more complex... leave it for now)
# # https://developer.salesforce.com/docs/atlas.en-us.api_tooling.meta/api_tooling/tooling_api_objects_traceflag.htm
# # Represents a trace flag that triggers an Apex debug log at the specified logging level.
# System.debug(
# 	[
# 		SELECT Id, ExpirationDate, TracedEntityId, DebugLevelId, LogType, ApexCode, ApexProfiling, Callout, Database, Nba, System, Validation, Visualforce, Workflow, Wave
# 		FROM TraceFlag
# 	]
# );
