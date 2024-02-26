import React, { useState, useEffect } from 'react';
import AWS from 'aws-sdk';
import './App.css';

const s3BucketName = 'albums143253-dev'; 
const prefix = 'private/eu-west-2:cb3aa4e6-3ac1-c16f-9f88-8e3f90e69f7c/test/Ariadna';
// const prefix = 'private/eu-west-2:cb3aa4e6-3ac1-c16f-9f88-8e3f90e69f7c/test/Snowfest';

const s3 = new AWS.S3({
  accessKeyId: process.env.REACT_APP_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_SECRET_ACCESS_KEY,
  region: 'eu-west-2'
});

function App() {
  const [pictureUrls, setPictureUrls] = useState([]);
  const [jsonData, setJsonData] = useState("");

  useEffect(() => {
    fetchMetadata();
    fetchPictures();
  }, []);


  const fetchMetadata = async () => {
    try {
      const data = await s3.getObject({
        Bucket: s3BucketName, Key: prefix + "/metadata.json"}).promise();
      const jsonData = JSON.parse(data.Body.toString());
      setJsonData(jsonData);
    } catch (error) {
      console.error('Error fetching JSON file:', error);
    }
  };

  const fetchPictures = () => {
    const params = {
      Bucket: s3BucketName,
      Prefix: prefix
    };

    s3.listObjectsV2(params, (err, data) => {
      if (err) {
        console.error('Error fetching pictures:', err);
      } else {
        const pictureKeys = data.Contents.map(obj => obj.Key);
        pictureKeys.pop();
        // console.log(pictureKeys)
        const urls = pictureKeys.map(key => getSignedUrl(key));
        Promise.all(urls)
          .then(signedUrls => setPictureUrls(signedUrls))
          .catch(error => console.error('Error generating signed URLs:', error));
      }
    });
  };

  const getSignedUrl = (key) => {
    const params = {
      Bucket: s3BucketName,
      Key: key,
      Expires: 3600 
    };
    return new Promise((resolve, reject) => {
      s3.getSignedUrl('getObject', params, (err, url) => {
        if (err) {
          reject(err);
        } else {
          resolve(url);
        }
      });
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="header-title">{jsonData.eventName}</h1>
        <p className="header-description">{jsonData.eventDescription}</p>
        <div className="header-details">
          <p>Client: {jsonData.clientName}</p>
          <p>Location: {jsonData.eventLocation}</p>
          <p>Date: {jsonData.eventDate}</p>
        </div>
      </header>
      <div className="picture-gallery">
        {pictureUrls.map((url, index) => (
          <img key={index} src={url} alt={`Picture ${index}`} />
        ))}
      </div>
    </div>
  );
}

export default App;
