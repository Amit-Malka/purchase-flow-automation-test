interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
  duration: number;
}

interface TestSummary {
  passed: number;
  failed: number;
  total: number;
  duration: number;
}

export async function sendSlackReport(
  results: TestResult[],
  summary: TestSummary
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not set, skipping Slack notification');
    return;
  }

  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const emoji = summary.failed === 0 ? ':white_check_mark:' : ':x:';
  
  // Format test results
  const resultLines = results.map(result => {
    const icon = result.status === 'passed' ? ':white_check_mark:' : ':x:';
    const testName = formatTestName(result.title);
    const errorMsg = result.error ? `\n   _${truncateError(result.error)}_` : '';
    return `${icon} ${testName}${errorMsg}`;
  }).join('\n');

  const durationSeconds = (summary.duration / 1000).toFixed(1);

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} QA Test Results - ${timestamp}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Passed:*\n${summary.passed}/${summary.total}`,
          },
          {
            type: 'mrkdwn',
            text: `*Failed:*\n${summary.failed}/${summary.total}`,
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${durationSeconds}s`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${summary.failed === 0 ? 'All Passed' : 'Failed'}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Test Results:*\n${resultLines}`,
        },
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Failed to send Slack message: ${response.statusText}`);
  }

  console.log('Slack report sent successfully');
}

function formatTestName(title: string): string {
  // Convert test file paths to readable names
  const cleanTitle = title
    .replace(/\.\.\/tests\//g, '')
    .replace(/\.spec$/g, '')
    .replace(/\//g, ' - ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleanTitle;
}

function truncateError(error: string, maxLength: number = 100): string {
  if (error.length <= maxLength) {
    return error;
  }
  return error.substring(0, maxLength) + '...';
}
