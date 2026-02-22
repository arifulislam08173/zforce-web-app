import React from 'react';
import './Card.css';

const Card = ({ title, value }) => (
  <div className="card">
    <h3>{title}</h3>
    <p>{value}</p>
  </div>
);

export default Card;
