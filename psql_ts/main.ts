import { Client } from 'pg';
import * as fs from 'fs/promises'
import { relative } from 'path';

export default class PSQL {
  private conn: Client;
  private queryMap: { fileName: string };

  async _connect() {
    if (!this.conn) {
      const client = new Client(/* Options are automatically set via your .env file */);
      await client.connect();
      this.conn = client;
      await this._buildQueryMap();
    }
  }

  async _buildQueryMap() {
    // First lets get a list of all the file names
    const queryDir = relative(__dirname, 'your_path_to_query_folder');
    const queryFileNames = await fs.readdir(queryDir);
    // Then lets go through each file name
    for (const fileName of queryFileNames) {
      // And finally, lets extract the SQL text and store it in our queryMap for use later.
      const queryText = await fs.readFile(`${queryDir}/${fileName}`);
      const formattedName = fileName.split('.sql')[0]; // Lets also remove the .sql to be a bit cleaner
      this.queryMap[formattedName] = queryText;
    }
  }

  async queryFile(queryName: string, args: any[]) : Promise<any[]> {
    const query = this.queryMap[queryName];
    if (!query) throw new Error(`The following query: ${queryName} does not exist.`);
    return await this.queryString(query, args);
  }

  async queryString(query: string, args: any[]) : Promise<any[]> {
    if (!this.conn) await this._connect(); // This is just to catch errors
    const { rows } = (await this.conn.query(query, args));
    return rows;
  }

}
