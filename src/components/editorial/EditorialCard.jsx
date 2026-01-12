import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EditorialCard = ({ 
  title, 
  description, 
  icon: Icon, 
  to, 
  tag, 
  value,
  valueColor = 'default',
  delay = 0 
}) => {
  const valueColorClasses = {
    default: 'text-foreground',
    success: 'text-success',
    danger: 'text-danger',
    warning: 'text-warning',
    primary: 'text-primary',
  };

  const Content = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="group relative bg-background border border-border rounded-lg p-6 transition-all duration-300 hover:shadow-editorial hover:-translate-y-1"
    >
      {/* Tag */}
      {tag && (
        <span className="editorial-label text-foreground-subtle mb-3 block">
          {tag}
        </span>
      )}

      {/* Icon */}
      {Icon && (
        <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      )}

      {/* Value (for metric cards) */}
      {value && (
        <p className={`text-3xl font-bold mb-2 ${valueColorClasses[valueColor]}`}>
          {value}
        </p>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-foreground-subtle leading-relaxed">
          {description}
        </p>
      )}

      {/* Arrow for linked cards */}
      {to && (
        <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">Explorar</span>
          <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </motion.div>
  );

  if (to) {
    return (
      <Link to={to} className="block min-h-0 min-w-0">
        <Content />
      </Link>
    );
  }

  return <Content />;
};

export const EditorialCardGrid = ({ children, columns = 3 }) => {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {children}
    </div>
  );
};

export default EditorialCard;
