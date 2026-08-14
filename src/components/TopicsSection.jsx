import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaBookOpen, FaLanguage, FaComments } from 'react-icons/fa';
import Button from './Button';

const topics = [
  {
    icon: FaBookOpen,
    title: 'Grammar',
    description: 'Test your grammar knowledge in chosen situations related to C-Suites',
  },
  {
    icon: FaLanguage,
    title: 'Vocabulary',
    description: 'Test you vocabulary knowledge in chosen situations related to C-Suites',
  },
  {
    icon: FaComments,
    title: 'Situations',
    description: 'Test your communication skills in chosen situations related to C-Suites',
    fullWidth: true
  }
];

const TopicsSection = () => {
  const navigate = useNavigate();
  return (
    <section className="pb-24 px-6 md:px-20 bg-brand-light/95 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[32px] font-medium text-brand-primary mb-12"
        >
          Assessment topics
        </motion.h2>

        <div className="w-full flex flex-col gap-6 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {topics.slice(0, 2).map((topic, idx) => (
              <TopicCard key={idx} topic={topic} idx={idx} />
            ))}
          </div>
          <div className="w-full">
            <TopicCard topic={topics[2]} idx={2} />
          </div>
        </div>

        <motion.button
          onClick={() => {
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                if (user?.role === 'ADMIN') {
                  navigate('/admin');
                  return;
                }
              } catch {
                // ignore
              }
              navigate('/assessment/question');
            } else {
              navigate('/assessment/register');
            }
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          viewport={{ once: true }}
          className="bg-brand-primary text-brand-light text-[18px] font-medium px-12 py-4 rounded-full shadow-lg hover:bg-blue-800 transition-colors cursor-pointer"
        >
          Take your assessment
        </motion.button>
      </div>
    </section>
  );
};

const TopicCard = ({ topic, idx }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay: idx * 0.1, duration: 0.5 }}
    className="bg-white/95 rounded-2xl shadow-[0px_0px_5px_0px_rgba(0,58,143,0.3)] p-10 flex items-center relative overflow-hidden h-full group transition-all duration-300 hover:shadow-lg"
  >
    {/* Large Background Icon */}
    <div className="absolute -left-8 -top-8 w-40 h-40 opacity-10 pointer-events-none transition-transform duration-500 group-hover:scale-110 text-brand-primary flex items-center justify-center">
      <topic.icon className="w-full h-full" />
    </div>

    <div className="ml-16 z-10 flex flex-col">
      <h3 className="text-[32px] font-medium text-brand-primary mb-2 leading-none">{topic.title}</h3>
      <p className="text-[20px] text-brand-primary/80 font-medium">{topic.description}</p>
    </div>
  </motion.div>
);

export default TopicsSection;
