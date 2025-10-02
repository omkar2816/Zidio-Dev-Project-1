import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp,
  PieChart,
  LineChart,
  Database,
  Lock,
  Smartphone,
  Globe
} from 'lucide-react';
import { useScrollReveal } from '../../../hooks/useScrollAnimations';

const Features = () => {
  const { ref: headerRef, isInView: headerInView } = useScrollReveal();
  const { ref: gridRef, isInView: gridInView } = useScrollReveal({ amount: 0.2 });
  
  const features = [
    {
      icon: FileSpreadsheet,
      title: "Data Import & Processing",
      description: "Import Excel, CSV, and JSON files with intelligent data type detection and automated cleaning pipelines.",
      color: "emerald"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics Engine",
      description: "Comprehensive statistical analysis, correlation matrices, and predictive modeling with machine learning algorithms.",
      color: "teal"
    },
    {
      icon: PieChart,
      title: "Interactive Visualizations",
      description: "Dynamic 2D & 3D charts, real-time dashboards, and customizable data visualization widgets.",
      color: "green"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "End-to-end encryption, role-based access control, and SOC 2 compliant data protection standards.",
      color: "emerald"
    },
    {
      icon: Users,
      title: "Collaborative Analytics",
      description: "Team workspaces, shared dashboards, real-time collaboration, and centralized project management.",
      color: "teal"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Stream processing, live data updates, automated alerts, and instant notification systems.",
      color: "green"
    },
    {
      icon: Database,
      title: "Intelligent Data Processing",
      description: "AI-powered data cleaning, pattern recognition, anomaly detection, and automated feature engineering for better insights.",
      color: "emerald"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics Suite",
      description: "Advanced forecasting models, trend analysis, risk assessment, and business intelligence reporting tools.",
      color: "teal"
    },
    {
      icon: Globe,
      title: "Analytics Collaboration Hub",
      description: "Real-time team collaboration, dashboard sharing, version control, and integrated communication tools.",
      color: "green"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6
      }
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
      green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      blue: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      purple: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
      red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      yellow: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
      indigo: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
    };
    return colors[color] || colors.emerald;
  };

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-green-50/30 dark:from-gray-900 dark:via-emerald-900/10 dark:to-teal-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Advanced Analytics Platform for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              {" "}Data Excellence
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive data analytics suite with enterprise-grade security, real-time collaboration, and intelligent insights.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          ref={gridRef}
          variants={containerVariants}
          initial="hidden"
          animate={gridInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className={`inline-flex p-3 rounded-xl ${getColorClasses(feature.color)} mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
