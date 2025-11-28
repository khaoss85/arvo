'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from 'next-intl';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}

function FAQItem({ question, answer, isOpen, onToggle, delay }: FAQItemProps) {
  return (
    <motion.div
      className="border-b border-border"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <button
        className="w-full py-5 flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        }`}
      >
        <p className="text-muted-foreground">{answer}</p>
      </div>
    </motion.div>
  );
}

export function PricingFAQ() {
  const t = useTranslations('pricing.faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('items.betaFree.question'),
      answer: t('items.betaFree.answer'),
    },
    {
      question: t('items.afterBeta.question'),
      answer: t('items.afterBeta.answer'),
    },
    {
      question: t('items.cancel.question'),
      answer: t('items.cancel.answer'),
    },
    {
      question: t('items.freeTrial.question'),
      answer: t('items.freeTrial.answer'),
    },
    {
      question: t('items.payment.question'),
      answer: t('items.payment.answer'),
    },
    {
      question: t('items.refund.question'),
      answer: t('items.refund.answer'),
    },
  ];

  return (
    <section className="py-24 px-4 bg-muted/30">
      <div className="container max-w-3xl mx-auto">
        {/* Section Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="bg-background rounded-2xl border border-border p-6 md:p-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Contact Note */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t('contactNote')}{' '}
          <a
            href="mailto:support@arvo.guru"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            support@arvo.guru
          </a>
        </motion.p>
      </div>
    </section>
  );
}
