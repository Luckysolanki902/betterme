export const theme = {
  root: {
    fontFamily: '"Inter", sans-serif',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
  },
  paragraph: {
    margin: '0 0 16px 0',
    lineHeight: '1.75',
    fontSize: '16px',
  },
  heading: {
    h1: {
      fontSize: '28px',
      fontWeight: '700',
      margin: '28px 0 16px 0',
      lineHeight: '1.3',
    },
    h2: {
      fontSize: '24px',
      fontWeight: '600',
      margin: '24px 0 14px 0',
      lineHeight: '1.35',
    },
    h3: {
      fontSize: '20px',
      fontWeight: '600',
      margin: '20px 0 12px 0',
      lineHeight: '1.4',
    },
    h4: {
      fontSize: '18px',
      fontWeight: '600',
      margin: '18px 0 10px 0',
      lineHeight: '1.45',
    },
    h5: {
      fontSize: '16px',
      fontWeight: '600',
      margin: '16px 0 8px 0',
      lineHeight: '1.5',
    },
  },
  quote: {
    padding: '12px 24px',
    marginLeft: '0',
    marginRight: '0',
    fontSize: '15px',
    color: 'rgb(55, 65, 81)',
    borderLeftWidth: '4px',
    borderLeftColor: '#e5e7eb',
    fontStyle: 'italic',
    background: 'rgba(0, 0, 0, 0.03)',
    borderRadius: '0 4px 4px 0',
  },
  list: {
    ol: {
      padding: '0 0 0 24px',
      margin: '0 0 16px 0',
    },
    ul: {
      padding: '0 0 0 24px',
      margin: '0 0 16px 0',
    },
    listitem: {
      margin: '8px 0',
    },
    nested: {
      listitem: {
        margin: '4px 0',
      },
    },
    checklist: {
      marginLeft: '24px',
    },
  },
  image: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '12px',
    marginBottom: '12px',
    borderRadius: '4px',
    maxWidth: '100%',
  },
  link: {
    color: '#4385f5',
    textDecoration: 'none',
  },
  text: {
    bold: {
      fontWeight: 'bold',
    },
    italic: {
      fontStyle: 'italic',
    },
    underline: {
      textDecoration: 'underline',
    },
    strikethrough: {
      textDecoration: 'line-through',
    },
    underlineStrikethrough: {
      textDecoration: 'underline line-through',
    },
    code: {
      backgroundColor: 'rgb(240, 242, 245)',
      padding: '2px 4px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '0.9em',
    },
  },
  table: {
    border: '1px solid #eee',
    borderCollapse: 'collapse',
    margin: '16px 0',
    tableLayout: 'fixed',
    width: '100%',
    cell: {
      border: '1px solid #eee',
      padding: '8px',
      verticalAlign: 'top',
    },
  },
};
