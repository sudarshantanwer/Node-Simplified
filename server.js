const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = 3000;

// Improved function to create the new CSV file
const createNewCsv = (inputFilePath, outputFilePath) => {
  const records = [];

  // Create CSV parser with delimiter and trimming options
  const parser = fs.createReadStream(inputFilePath).pipe(parse({
    delimiter: ',',
    columns: true,  // Auto-parses columns into an object
    skip_empty_lines: true,
    trim: true      // Trim white spaces from each cell
  }));

  parser.on('data', (row) => {
    // Debugging: log the parsed row
    console.log('Parsed Row:', row);

    // Extract only the required columns and add hardcoded values
    const newRow = {
      'Summary': row['Key']?.trim() || '' + '-' + row['Summary']?.trim() || '',      // Safely handle missing columns
      'Components': row['Components']?.trim() || '',  // Safely handle missing columns
      'Priority': row['Priority']?.trim() || '',    // Safely handle missing columns
      'Assignee': 'Unassigned',                          // Hardcoded value
      'Reporter': 'Astro',                         // Hardcoded value
      'Status': 'Open',
      'Triage_Status': 'Triaged',
      'Affects versions': 'No_Version',
      'Reproducibility_%age': '100%'                           // Hardcoded value
    };

    // Log the final row to be written to the new CSV
    console.log('New Row to Write:', newRow);

    records.push(newRow);
  });

  parser.on('end', () => {
    console.log('Final records:', records);

    // Define the new CSV writer
    const csvWriter = createObjectCsvWriter({
      path: outputFilePath,
      header: [
        { id: 'Summary', title: 'Summary' },
        { id: 'Components', title: 'Components' },
        { id: 'Priority', title: 'Priority' },
        { id: 'Assignee', title: 'Assignee' },
        { id: 'Reporter', title: 'Reporter' },
        { id: 'Status', title: 'Status' },
        { id: 'Triage_Status', title: 'Triage_Status' },
        { id: 'Affects versions', title: 'Affects versions' },
        { id: 'Reproducibility_%age', title: 'Reproducibility_%age' }
      ]
    });

    // Write records to the new CSV file
    csvWriter.writeRecords(records)
      .then(() => {
        console.log('New CSV file created successfully.');
      })
      .catch(err => {
        console.error('Error writing new CSV:', err);
      });
  });

  parser.on('error', (err) => {
    console.error('Error parsing CSV:', err);
  });
};

// Endpoint to trigger the CSV processing
app.get('/generate-new-csv', (req, res) => {
  const inputFilePath = path.join(__dirname, 'source.csv');  // Path to your source CSV file
  const outputFilePath = path.join(__dirname, 'new_output.csv');  // Path to the output file

  createNewCsv(inputFilePath, outputFilePath);

  res.send('New CSV generation in progress. Check server logs for updates.');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
