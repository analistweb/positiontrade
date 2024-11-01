import React from 'react';

const NewsSection = ({ news }) => (
  <div className="space-y-4">
    {news.map((item, index) => (
      <div key={index} className="border-b pb-4 last:border-b-0">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
          <h3 className="font-semibold mb-1">{item.title}</h3>
          <div className="text-sm text-muted-foreground">
            <span>{item.source.title}</span> • 
            <span className="ml-2">
              {new Date(item.published_at).toLocaleDateString()}
            </span>
          </div>
        </a>
      </div>
    ))}
  </div>
);

export default NewsSection;