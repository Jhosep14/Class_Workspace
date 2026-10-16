export const markRecordTypeDefs = `#graphql
  type MarkRecord {
    id: ID!
    studentId: String!
    mathScore: Float!
    scienceScore: Float!
    englishScore: Float!
    spanishScore: Float!
    averageScore: Float!
  }
  input NewMarkRecordInput {
    studentId: String!
    mathScore: Float!
    scienceScore: Float!
    englishScore: Float!
    spanishScore: Float!
  }
  input UpdateMarkRecordInput {
    mathScore: Float
    scienceScore: Float
    englishScore: Float
    spanishScore: Float
  }
  extend type Query {
    markRecords: [MarkRecord!]!
    markRecord(studentId: String!): MarkRecord
  }
  extend type Mutation {
    createMarkRecord(input: NewMarkRecordInput!): MarkRecord!
    updateMarkRecord(studentId: String!, input: UpdateMarkRecordInput!): MarkRecord!
    deleteMarkRecord(studentId: String!): Boolean!
  }
`;
