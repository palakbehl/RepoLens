/**
 * Utility functions for score status, styling, and explanations.
 */

export const getScoreStatus = (score) => {
  if (score >= 90) return { label: 'Excellent', key: 'excellent' };
  if (score >= 75) return { label: 'Good', key: 'good' };
  if (score >= 50) return { label: 'Needs Improvement', key: 'warning' };
  if (score >= 25) return { label: 'Poor', key: 'poor' };
  return { label: 'Critical', key: 'critical' };
};

export const getScoreColor = (score) => {
  if (score >= 90) {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      bar: 'bg-green-600',
    };
  }
  if (score >= 75) {
    return {
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      bar: 'bg-blue-600',
    };
  }
  if (score >= 50) {
    return {
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      bar: 'bg-amber-500',
    };
  }
  if (score >= 25) {
    return {
      text: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      bar: 'bg-orange-500',
    };
  }
  return {
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    bar: 'bg-red-600',
  };
};

export const getScoreExplanation = (score, type) => {
  const status = getScoreStatus(score).label;

  switch (type.toLowerCase()) {
    case 'health':
      if (score >= 90) {
        return 'The repository is in excellent overall health. Code quality is high, dependencies are fresh, and documentation is extensive.';
      }
      if (score >= 75) {
        return 'The repository is in good overall health. Standard software engineering practices are followed and files are well maintained.';
      }
      if (score >= 50) {
        return 'Repository health needs work. Code quality issues, technical debt, or sparse documentation require attention.';
      }
      if (score >= 25) {
        return 'Repository health is poor. High cyclomatic complexity, outdated dependencies, and low documentation scores affect stability.';
      }
      return 'Repository health is critically low due to poor activity, limited documentation, and maintainability concerns.';

    case 'documentation':
      if (score >= 90) {
        return 'Documentation is comprehensive. It includes detailed guides, installation instructions, contribution steps, and clear APIs.';
      }
      if (score >= 75) {
        return 'Documentation is solid. README covers setup and main workflows, with good commenting throughout the repository.';
      }
      if (score >= 50) {
        return 'README and project documentation exist but important setup, usage, or contribution details may be missing.';
      }
      if (score >= 25) {
        return 'Documentation is sparse. Project structure or installation steps are undocumented or out of date.';
      }
      return 'Critical documentation deficit. README is empty, missing, or lacks fundamental instructions on how to compile and run the project.';

    case 'complexity':
      if (score >= 90) {
        return 'Code structure is simple and clean. Files are highly modularized, functions are concise, and duplication is minimal.';
      }
      if (score >= 75) {
        return 'Complexity is low. Code is structured cleanly and easily readable, with good functional separation.';
      }
      if (score >= 50) {
        return 'Code structure appears moderately complex and may benefit from refactoring or modularization.';
      }
      if (score >= 25) {
        return 'High complexity detected. Heavy classes, long functions, or duplicate routines increase technical debt.';
      }
      return 'Critical complexity level. Highly nested, monolithic structures and severe code duplication make maintenance very difficult.';

    case 'activity':
      if (score >= 90) {
        return 'The repository is highly active. Frequent commits, active pull request reviews, and active releases indicate robust maintenance.';
      }
      if (score >= 75) {
        return 'The repository has good activity. Regular updates and recent code check-ins show active development.';
      }
      if (score >= 50) {
        return 'Moderate activity. Periodic commits occur, but release intervals are slow or contributor counts are dropping.';
      }
      if (score >= 25) {
        return 'Low development activity. Commits are sparse and issues are sitting open for long periods.';
      }
      return 'Recent development activity is extremely low. The repository may be inactive or rarely maintained.';

    default:
      return '';
  }
};
