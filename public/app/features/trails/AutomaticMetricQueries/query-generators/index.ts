import bucket from './bucket';
import general from './general';
import sum from './sum';
import { MetricQueriesGenerator } from './types';

const SUFFIX_TO_GENERATOR: Record<string, MetricQueriesGenerator> = {
  bucket: bucket.generator,
  sum: sum.generator,
};

export function getQueryGeneratorFor(suffix?: string) {
  if (!suffix || suffix === '') {
    return null;
  }
  return SUFFIX_TO_GENERATOR[suffix] || general.generator;
}
