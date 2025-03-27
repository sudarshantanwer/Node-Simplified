const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const PORT = 3000;

// Set up static files to serve the HTML from 'public' directory
app.use(express.static('public'));

// Configure multer storage with a fixed file name
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Destination folder
  },
  filename: function (req, file, cb) {
    cb(null, 'uploaded-file.csv');  // Fixed file name
  }
});

// Use the storage configuration
const upload = multer({ storage: storage });

// Route to handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  console.log(`File uploaded: ${file.originalname}`);
  res.status(200).json({ message: 'File uploaded successfully.' });
});

// Route to convert and download CSV
app.get('/convert', (req, res) => {
  const inputFilePath = path.join(__dirname, 'uploads', 'uploaded-file.csv');
  const outputFolderPath = path.join(__dirname, 'Exported File');
  
  // Ensure 'Exported File' folder exists
  if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath, { recursive: true });
  }
  
  const outputFilePath = path.join(outputFolderPath, 'output.csv');
  
  // Call the CSV conversion function
  createNewCsv(inputFilePath, outputFilePath);
  
  // Send the converted file as a response for download
  res.download(outputFilePath, 'output.csv', (err) => {
    if (err) {
      console.error('Error sending the file:', err);
    } else {
      console.log('File sent successfully.');
    }
  });
});

// Function to convert CSV and create new CSV
const createNewCsv = (inputFilePath, outputFilePath) => {
  const records = [];
  let maxComponents = 0; // Track the max number of components across all rows

  const parser = fs.createReadStream(inputFilePath).pipe(parse({
    delimiter: ',',
    columns: true,
    skip_empty_lines: true,
    trim: true
  }));

  parser.on('data', (row) => {
    const componentsArray = getComponentsData(row); // Get array of components
    const componentsColumns = {};

    // Dynamically add 'Components_X' columns based on number of components
    componentsArray.forEach((component, index) => {
      componentsColumns[`Components_${index + 1}`] = component;
    });

    // Track the maximum number of components in any row
    maxComponents = Math.max(maxComponents, componentsArray.length);

    const newRow = {
      'Summary': (row['Key']?.trim() || '') + ' | ' + row['Summary']?.trim() || '',
      'Priority': row['Priority']?.trim() || '',
      'Description': 'https://astrogo.atlassian.net/browse/' + row['Key'],
      'Status': 'Open',
      'Triage_Status': 'Triaged',
      'Affects versions': 'No_Version',
      'Reproducibility_%age': '100%',
      ...componentsColumns // Add dynamically generated component columns
    };
    records.push(newRow);
  });

  parser.on('end', () => {
    const header = [
      { id: 'Summary', title: 'Summary' },
      { id: 'Priority', title: 'Priority' },
      { id: 'Description', title: 'Description' },
      { id: 'Status', title: 'Status' },
      { id: 'Triage_Status', title: 'Triage_Status' },
      { id: 'Affects versions', title: 'Affects versions' },
      { id: 'Reproducibility_%age', title: 'Reproducibility_%age' }
    ];

    // Dynamically generate 'Components_X' headers based on the maximum number of components
    for (let i = 1; i <= maxComponents; i++) {
      header.push({ id: `Components_${i}`, title: `Components` });
    }

    const csvWriter = createObjectCsvWriter({
      path: outputFilePath,
      header: header
    });

    csvWriter.writeRecords(records)
      .then(() => {
        console.log('New CSV created successfully.');
      })
      .catch(err => {
        console.error('Error writing new CSV:', err);
      });
  });

  parser.on('error', (err) => {
    console.error('Error parsing CSV:', err);
  });
};

function getComponentsData(row) {
  const input = row['Components']?.trim() || '';
  const values = input.split(";");
  const mappedValues = values.map(mapComponent).filter(Boolean);
  return mappedValues;
}

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
