import React from 'react';
import { motion } from 'framer-motion';

const WelcomeSection = () => {
  return (
    <section className="py-24 px-10 bg-white text-center flex justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-brand-dark mb-6 leading-tight">
          Welcome to your C-Suite English Communication Assessment
        </h2>
        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
          Evaluate how effectively you communicate in high-stakes business environments and discover where your English stands today.
        </p>
      </motion.div>
    </section>
  );
};

export default WelcomeSection;
