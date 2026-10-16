export const studentTypeDefs = `#graphql
  type Student {
    id: ID!
    studentId: String!
    name: String!
    lastName: String!
    sex: String!
    age: Int!
    class: String!
    grade: Int!
    dob: String!
    profileImageKey: String
  }
  input NewStudentInput {
    studentId: String!
    name: String!
    lastName: String!
    sex: String!
    age: Int!
    class: String!
    grade: Int!
    dob: String!
    profileImageKey: String
  }
  input UpdateStudentInput {
    name: String
    lastName: String
    sex: String
    age: Int
    class: String
    grade: Int
    dob: String
    profileImageKey: String
  }
  type Query {
    students: [Student!]!
    student(studentId: String!): Student
  }
  type Mutation {
    createStudent(input: NewStudentInput!): Student!
    updateStudent(studentId: String!, input: UpdateStudentInput!): Student!
    deleteStudent(studentId: String!): Boolean!
  }
`;
