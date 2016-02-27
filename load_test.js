var jsforce = require('jsforce');
var fs = require('fs');
var _ = require('underscore');

var conn = new jsforce.Connection({
  // you can change loginUrl to connect to sandbox or prerelease env.
  //loginUrl : 'https://na34.salesforce.com'
});

conn.login('rowanxmas@gmail.com', '111qqqSSS8wDvDVUSsCXWJfMViL5cSgVKx', function(err, res) {
    if (err) { return console.error(err); }


    conn.sobject("Insight__c").create({ Parents__c: '<ul class="slds-list--horizontal slds-has-dividers--right slds-has-inline-block-links"><li class="slds-list__item" ><span style="font-weight:700">Case Number: </span><a href="https://rowan-dev-ed.my.salesforce.com/50061000002fqO5AAI">00001028</a></li></ul>',
    Data_Source__c: 'Top 10 Cases by Age',
    ReportID__c: '00O61000003gDUyEAM',
    Long_Name__c: 'Cases found (0) matching <span style="font-weight:700">Account Name: </span>Dickenson plc',
    Name: 'Cases from  : 00001028 : Dickenson plc',
    Table_Data__c: '<div class="slds"><table class="slds-table slds-table--bordered"><thead> <tr class="slds-text-heading--label"><th scope="col"><span class="slds-truncate">Case Owner</span></th><th scope="col"><span class="slds-truncate">Subject</span></th><th scope="col"><span class="slds-truncate">Status</span></th><th scope="col"><span class="slds-truncate">Priority</span></th><th scope="col"><span class="slds-truncate">Age (Days)</span></th>  </thead><tbody><tr class="slds-hint-parent"><td data-label="Case Owner"><span class="slds-truncate">Rowan Christmas</span></td><td data-label="Subject"><span class="slds-truncate">Do 3</span></td><td data-label="Status"><span class="slds-truncate">New</span></td><td data-label="Priority"><span class="slds-truncate">Medium</span></td><td data-label="Age (Days)"><span class="slds-truncate">0</span></td></tbody></table></div>',
    Details__c: '0 Cases found.' }, function(err, ret) {
      if (err || !ret.success) { return console.error(err, ret); }
      console.log("Created record id : " + ret.id);
      // ...
    });

});
