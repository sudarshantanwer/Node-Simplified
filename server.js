const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = 3000;

// Helper function to split and convert the CSV with error handling
const splitJiraTasks = async (inputFilePath, outputFilePath) => {
  const records = [];

  return new Promise((resolve, reject) => {
    // Ensure file exists before proceeding
    if (!fs.existsSync(inputFilePath)) {
      return reject(new Error(`File not found: ${inputFilePath}`));
    }

    // Read the original CSV (with tab delimiter)
    fs.createReadStream(inputFilePath)
      .pipe(csv({ separator: '\t' }))  // Specify tab as the delimiter
      .on('data', (row) => {
        try {
          // Ensure the 'Components' column exists before attempting to split
          if (!row.Components) {
            throw new Error(`Missing 'Components' field in row: ${JSON.stringify(row)}`);
          }

          const components = row.Components.split(',').map(c => c.trim());

          // Split row into multiple rows, one for each component
          components.forEach(component => {
            records.push({
              'Issue Key': row['Issue Key'],
              Summary: row.Summary,
              'Issue Type': row['Issue Type'],
              Status: row.Status,
              Priority: row.Priority,
              Assignee: row.Assignee,
              Reporter: row.Reporter,
              Created: row.Created,
              Updated: row.Updated,
              Component: component,
              Description: row.Description
            });
          });
        } catch (err) {
          console.error(`Error processing row: ${err.message}`);
        }
      })
      .on('end', async () => {
        if (records.length === 0) {
          return reject(new Error('No records were processed from the CSV.'));
        }

        // Write the split records into the new CSV file
        const csvWriter = createObjectCsvWriter({
          path: outputFilePath,
          header: [
            { id: 'Issue Key', title: 'Issue Key' },
            { id: 'Summary', title: 'Summary' },
            { id: 'Issue Type', title: 'Issue Type' },
            { id: 'Status', title: 'Status' },
            { id: 'Priority', title: 'Priority' },
            { id: 'Assignee', title: 'Assignee' },
            { id: 'Reporter', title: 'Reporter' },
            { id: 'Created', title: 'Created' },
            { id: 'Updated', title: 'Updated' },
            { id: 'Component', title: 'Component' },
            { id: 'Description', title: 'Description' }
          ]
        });

        try {
          await csvWriter.writeRecords(records);
          console.log('CSV file successfully written');
          resolve();
        } catch (err) {
          reject(new Error(`Error writing CSV: ${err.message}`));
        }
      })
      .on('error', (err) => {
        console.error(`Error reading CSV file: ${err.message}`);
        reject(err);
      });
  });
};

// Endpoint to split the Jira CSV file
app.get('/split-jira-tasks', async (req, res) => {
  const inputFilePath = './jira_tickets.csv';  // Path to the input file
  const outputFilePath = './jira_tickets_split.csv';  // Path to the output file

  try {
    await splitJiraTasks(inputFilePath, outputFilePath);
    res.send('CSV splitting completed successfully.');
  } catch (err) {
    console.error(`Error during CSV splitting: ${err.message}`);
    res.status(500).send(`Error during CSV splitting: ${err.message}`);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
