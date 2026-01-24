/**
 * Extracts variable names from prompt content
 * Variables are denoted by {{variableName}} syntax
 * 
 * @param content - The prompt content to extract variables from
 * @returns Array of unique variable names found
 */
export const extractVariables = (content: string): string[] => {
  const regex = /\{\{(\w+)\}\}/g;
  const vars: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    if (varName && !vars.includes(varName)) {
      vars.push(varName);
    }
  }
  
  return vars;
};

/**
 * Replaces variables in content with their values
 * 
 * @param content - The content containing {{variable}} placeholders
 * @param variables - Object mapping variable names to their values
 * @returns Content with variables replaced by their values
 */
export const replaceVariables = (
  content: string,
  variables: Record<string, string>
): string => {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  
  return result;
};
