import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { exec2JSON } from '../../../lib/exec';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@andrew.trautmann/sfdx-deploy-tools', 'retrieve_dashboards');

export default class Delta extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    'sfdx deploytools:retrieve:dashboards -u <org alias>'
  ];

  protected static flagsConfig = {
    folders: flags.array({
      char: 'f',
      description: messages.getMessage('foldersFlagDescription')
    }),
    managed: flags.boolean({
      char: 'm',
      description: messages.getMessage('managedFlagDescription'),
      default: false
    }),
    quiet: flags.builtin(),
    verbose: flags.builtin()
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true; // TODO - change this back to true

  private loggingEnabled;

  public async run(): Promise<AnyJson> {
    this.loggingEnabled = (!this.flags.quiet && !this.flags.json);
    let jsonResponse: AnyJson = {};

    const conn = this.org.getConnection();

    // Query for dashboards
    if (this.loggingEnabled) { this.ux.startSpinner(messages.getMessage('spinnerGettingNames')); }

    const allFolders = await conn.autoFetchQuery('SELECT Name, DeveloperName FROM Folder WHERE Type = \'Dashboard\'');
    const foldersByName = new Map<string, string>();
    const foldersByNameDevName = new Map<string, string>();
    allFolders.records.forEach(f => {
      foldersByNameDevName.set(f.Name, f.Name);
      foldersByNameDevName.set(f.DeveloperName, f.Name);
      foldersByName.set(f.Name, f.DeveloperName);
    });

    let query = 'SELECT Id, DeveloperName, FolderName, NamespacePrefix FROM Dashboard';
    const conditions = [];
    if (!this.flags.managed) {
      conditions.push('NamespacePrefix = null');
    }
    if (this.flags.folders && this.flags.folders.length > 0) {
      const tempFolders = this.flags.folders.map(f => foldersByNameDevName.get(f));
      conditions.push(`FolderName IN ('${tempFolders.join('\', \'')}')`);
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ' ORDER BY FolderName, DeveloperName';
    const dashboardResults = await conn.autoFetchQuery(query);
    if (this.loggingEnabled) { this.ux.stopSpinner(); }

    if (dashboardResults.totalSize === 0) {
      if (this.loggingEnabled) { this.ux.log(messages.getMessage('noResults')); }
      return [];
    }

    // parse out and create package file (if needed)
    if (this.loggingEnabled) { this.ux.startSpinner(messages.getMessage('spinnerParsing')); }
    const itemsToRetrieve = new Set<string>();
    dashboardResults.records.forEach(dashboard => {
      const folderDevName = foldersByName.get(dashboard.FolderName) || 'unfiled$public';
      if (folderDevName !== 'unfiled$public') {
        itemsToRetrieve.add(folderDevName);
      }
      itemsToRetrieve.add(`${folderDevName}/${dashboard.DeveloperName}`);
    });
    if (this.loggingEnabled) { this.ux.stopSpinner(); }

    // Retrieve dashboards (with package or list of dashboard/folder names)
    if (this.loggingEnabled) { this.ux.startSpinner(messages.getMessage('spinnerRetrieving', [itemsToRetrieve.size])); }
    const types = [];
    itemsToRetrieve.forEach(item => types.push(`Dashboard:${item}`));
    jsonResponse = await exec2JSON(`sfdx force:source:retrieve -u ${this.org.getUsername()} -m ${types.join(',')} --json`);
    if (this.loggingEnabled) { this.ux.stopSpinner(); }

    // Return an object to be displayed with --json
    return (jsonResponse && jsonResponse.result) ? jsonResponse.result : jsonResponse;
  }
}
