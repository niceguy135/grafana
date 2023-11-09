import { css } from '@emotion/css';
import React, { useEffect, useState } from 'react';

import { DataSourceApi, PanelData } from '@grafana/data';
import { EditorRow, llms } from '@grafana/experimental';
import { config, reportInteraction } from '@grafana/runtime';
import { Button, Drawer, Tooltip, useTheme2 } from '@grafana/ui';

import { PrometheusDatasource } from '../../datasource';
import promqlGrammar from '../../promql';
import { promQueryModeller } from '../PromQueryModeller';
import { buildVisualQueryFromString } from '../parsing';
import { OperationExplainedBox } from '../shared/OperationExplainedBox';
import { OperationList } from '../shared/OperationList';
import { OperationListExplained } from '../shared/OperationListExplained';
import { OperationsEditorRow } from '../shared/OperationsEditorRow';
import { QueryBuilderHints } from '../shared/QueryBuilderHints';
import { RawQuery } from '../shared/RawQuery';
import { QueryBuilderOperation } from '../shared/types';
import { PromVisualQuery } from '../types';

import { MetricsLabelsSection } from './MetricsLabelsSection';
import { NestedQueryList } from './NestedQueryList';
import { EXPLAIN_LABEL_FILTER_CONTENT } from './PromQueryBuilderExplained';
import { PromQail, getStyles } from './promQail/PromQail';
import AI_Logo_color from './promQail/resources/AI_Logo_color.svg';

export interface Props {
  query: PromVisualQuery;
  datasource: PrometheusDatasource;
  onChange: (update: PromVisualQuery) => void;
  onRunQuery: () => void;
  data?: PanelData;
  showExplain: boolean;
}

// initial commit for hackathon-2023-08-promqail
// AI/ML + Prometheus
const prometheusPromQAIL = config.featureToggles.prometheusPromQAIL;

export const PromQueryBuilder = React.memo<Props>((props) => {
  const { datasource, query, onChange, onRunQuery, data, showExplain } = props;
  const [highlightedOp, setHighlightedOp] = useState<QueryBuilderOperation | undefined>();
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [llmAppEnabled, updateLlmAppEnabled] = useState<boolean>(false);

  const lang = { grammar: promqlGrammar, name: 'promql' };

  const initHints = datasource.getInitHints();

  useEffect(() => {
    async function checkLlms() {
      const check = (await llms.openai.enabled()).ok;
      updateLlmAppEnabled(check);
    }
    checkLlms();
  }, []);

  const theme = useTheme2();
  const styles = getStyles(theme);

  const queryAssistantButton = function () {
    const button = () => {
      return (
        <Button
          variant={'secondary'}
          onClick={() => {
            reportInteraction('grafana_prometheus_promqail_ai_button_clicked', {
              metric: query.metric,
            });
            setShowDrawer(true);
          }}
          disabled={!query.metric}
        >
          <img height={16} src={AI_Logo_color} alt="AI logo black and white" />
          {'\u00A0'}Get query suggestions
        </Button>
      );
    };

    const llmAppTrue = (
      <Tooltip content={'First, select a metric.'} placement={'bottom-end'}>
        {button()}
      </Tooltip>
    );

    const llmAppFalse = (
      <Tooltip
        interactive={true}
        placement={'auto-end'}
        content={
          <div className={styles.enableButtonTooltip}>
            <h6>Query Advisor is disabled</h6>
            <div>To enable Query Advisor you must:</div>
            <div>
              <ul>
                <li>
                  <a
                    href={'https://grafana.com/docs/grafana-cloud/alerting-and-irm/machine-learning/llm-plugin/'}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.link}
                  >
                    Install and enable the LLM plugin
                  </a>
                </li>
                <li>Select a metric</li>
              </ul>
            </div>
          </div>
        }
      >
        {button()}
      </Tooltip>
    );

    if (llmAppEnabled) {
      return llmAppTrue;
    } else {
      return llmAppFalse;
    }
  };

  return (
    <>
      {prometheusPromQAIL && showDrawer && (
        <Drawer scrollableContent={true} closeOnMaskClick={false} onClose={() => setShowDrawer(false)}>
          <PromQail
            query={query}
            closeDrawer={() => setShowDrawer(false)}
            onChange={onChange}
            datasource={datasource}
          />
        </Drawer>
      )}
      <EditorRow>
        <MetricsLabelsSection query={query} onChange={onChange} datasource={datasource} />
      </EditorRow>
      {initHints.length ? (
        <div className="query-row-break">
          <div className="prom-query-field-info text-warning">
            {initHints[0].label}{' '}
            {initHints[0].fix ? (
              <button type="button" className={'text-warning'}>
                {initHints[0].fix.label}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {showExplain && (
        <OperationExplainedBox
          stepNumber={1}
          title={<RawQuery query={`${query.metric} ${promQueryModeller.renderLabels(query.labels)}`} lang={lang} />}
        >
          {EXPLAIN_LABEL_FILTER_CONTENT}
        </OperationExplainedBox>
      )}
      <OperationsEditorRow>
        <OperationList<PromVisualQuery>
          queryModeller={promQueryModeller}
          // eslint-ignore
          datasource={datasource as DataSourceApi}
          query={query}
          onChange={onChange}
          onRunQuery={onRunQuery}
          highlightedOp={highlightedOp}
        />
        {prometheusPromQAIL && (
          <div
            className={css({
              padding: '0 0 0 6px',
            })}
          >
            {queryAssistantButton()}
          </div>
        )}
        <QueryBuilderHints<PromVisualQuery>
          datasource={datasource}
          query={query}
          onChange={onChange}
          data={data}
          queryModeller={promQueryModeller}
          buildVisualQueryFromString={buildVisualQueryFromString}
        />
      </OperationsEditorRow>
      {showExplain && (
        <OperationListExplained<PromVisualQuery>
          lang={lang}
          query={query}
          stepNumber={2}
          queryModeller={promQueryModeller}
          onMouseEnter={(op) => setHighlightedOp(op)}
          onMouseLeave={() => setHighlightedOp(undefined)}
        />
      )}
      {query.binaryQueries && query.binaryQueries.length > 0 && (
        <NestedQueryList
          query={query}
          datasource={datasource}
          onChange={onChange}
          onRunQuery={onRunQuery}
          showExplain={showExplain}
        />
      )}
    </>
  );
});

PromQueryBuilder.displayName = 'PromQueryBuilder';
