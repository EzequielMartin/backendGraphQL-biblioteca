const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v1: uuid } = require("uuid");
const { GraphQLError } = require("graphql");

let authors = [
  {
    name: "Robert Martin",
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: "Martin Fowler",
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963,
  },
  {
    name: "Fyodor Dostoevsky",
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821,
  },
  {
    name: "Joshua Kerievsky", // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: "Sandi Metz", // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
];

let books = [
  {
    title: "Clean Code",
    published: 2008,
    author: "Robert Martin",
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Agile software development",
    published: 2002,
    author: "Robert Martin",
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ["agile", "patterns", "design"],
  },
  {
    title: "Refactoring, edition 2",
    published: 2018,
    author: "Martin Fowler",
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring"],
  },
  {
    title: "Refactoring to patterns",
    published: 2008,
    author: "Joshua Kerievsky",
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "patterns"],
  },
  {
    title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
    published: 2012,
    author: "Sandi Metz",
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ["refactoring", "design"],
  },
  {
    title: "Crime and punishment",
    published: 1866,
    author: "Fyodor Dostoevsky",
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "crime"],
  },
  {
    title: "Demons",
    published: 1872,
    author: "Fyodor Dostoevsky",
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ["classic", "revolution"],
  },
];

const typeDefs = `
  type Book {
    title: String!
    author: String!
    published: Int!
    genres: [String!]!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book]!
    allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book
  }
`;

const resolvers = {
  Query: {
    bookCount: () => books.length,
    authorCount: () => authors.length,

    //Esto es para obtener la cant individual de autores usando la lista de libros
    // authorCount: () => {
    //   //Uso un Set, que es una estructura de datos que elimina los duplicados automaticamente. En este Set guardo los autores de los libros
    //   //Luego calculo cuantos elementos contiene usando la funcion size
    //   const uniqueAuthors = new Set(books.map((books) => books.author));
    //   const cantAuthors = uniqueAuthors.size;
    //   return cantAuthors;
    // },

    allBooks: (root, args) => {
      if (!args.author && !args.genre) {
        //Si no paso un autor ni un genero como parametro retorno todos los libros
        return books;
      } else if (args.author && !args.genre) {
        //Si paso un autor pero no un genero retorno los libros de ese autor
        return books.filter((b) => b.author === args.author);
      } else if (!args.author && args.genre) {
        //Si paso un genero pero no un autor retorno los libros de ese genero
        return books.filter((b) => b.genres.includes(args.genre));
      } else if (args.author && args.genre) {
        //Si paso ambos parametros retorno los libros de ese autor y ese genero
        return books.filter(
          (b) => b.author === args.author && b.genres.includes(args.genre)
        );
      }
    },
    allAuthors: () => {
      //Creo un array con los nombres de los autores una unica vez
      const autoresUnicos = [...new Set(books.map((book) => book.author))];

      //Genero la respuesta para cada autor del array
      return autoresUnicos.map((author) => {
        //Calculo la cantidad de libros que tiene este autor particular
        const cantidadLibros = books.filter(
          (book) => book.author === author
        ).length;

        //Obtengo el año de nacimiento de este autor particular
        const anioNacimiento = authors.find((a) => a.name === author).born;

        //Retorno los datos de este autor particular
        return {
          name: author,
          bookCount: cantidadLibros,
          born: anioNacimiento,
        };
      });
    },
  },
  Mutation: {
    addBook: (root, args) => {
      if (books.find((b) => b.title === args.title)) {
        throw new GraphQLError("Title must be unique", {
          extensions: {
            code: "BAD_USER_INPUT",
            invalidArgs: args.title,
          },
        });
      }

      const authorNames = books.map((book) => book.author);
      if (!authorNames.includes(args.author)) {
        const author = { name: args.author, id: uuid() };
        authors = authors.concat(author);
      }

      const book = { ...args, id: uuid() };
      books = books.concat(book);
      return book;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
