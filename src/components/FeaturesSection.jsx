import React from 'react';
import { motion } from 'framer-motion';
import { MdTimer } from 'react-icons/md';
import { FaTasks, FaChartBar } from 'react-icons/fa';

const features = [
  {
    icon: MdTimer,
    title: '15 - 20 Minutes',
    description: 'Designed to fit busy executive’s schedule.',
  },
  {
    icon: FaTasks,
    title: '30 Questions',
    description: 'Assessing communication skills that matter most.',
  },
  {
    icon: FaChartBar,
    title: 'Personalized Report',
    description: 'Clear insights into your strengths, level, and priorities.',
  }
];

const FeaturesSection = () => {
  return (
    <section className="pt-40 pb-20 px-6 md:px-20 bg-brand-light/95 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,58,143,0.15)" }}
              className="bg-white/95 rounded-2xl shadow-[0px_0px_5px_0px_rgba(0,58,143,0.3)] p-10 flex flex-col items-center text-center h-full transition-shadow duration-300"
            >
              <div className="w-14 h-14 mb-8 flex items-center justify-center text-brand-primary">
                <feature.icon className="w-full h-full" />
              </div>
              <h3 className="text-2xl font-semibold text-brand-primary mb-4">
                {feature.title}
              </h3>
              <p className="text-lg text-gray-800">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
