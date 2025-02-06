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

function mapComponent(alcComponent) {
  const mapping = {
      'Web': 'WEB',
      'Android': 'Android',
      'iOS': 'iOS',
      'Android TV': 'ATV',
      'WebOS': 'HTML TV',
      'Smart TV': 'HTML TV',
      'Tizen': 'HTML TV',
      'VIDAA': 'HTML TV',
      'CP backend': 'Backend',
      'DP Backend': 'DP Backend',
      'EM': 'CMS',
      'TV Stick': null, // <dont import>
      'TA': null, // <dont import>
      'EV': null, // <dont import>
      'OPC': null, // <dont import>
      'UES': null, // <dont import>
      'AMS': null, // <dont import>
      'Conviva': 'Throw Exception', // Throw exception
      'AA': 'Throw Exception', // Throw exception
      'Ads_Banner': 'Throw Exception', // Throw exception
      'CSAI': 'Throw Exception', // Throw exception
      'SSAI': 'Throw Exception', // Throw exception
      'VOD Publishing': 'Throw Exception', // Throw exception
      'Linear Publishing': 'Throw Exception' // Throw exception
  };

  const result = mapping[alcComponent];

  if (result === 'Throw Exception') {
      throw new Error(`Exception: Check ALC jira for '${alcComponent}' and manually map correct component.`);
  } else if (result === null) {
      return null; // <dont import> condition
  } else {
      return result;
  }
}

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
