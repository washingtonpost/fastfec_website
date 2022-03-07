# FastFEC Website

The website for the [FastFEC](https://github.com/washingtonpost/FastFEC) project.

## Local development

After installing the dependencies (ensuring you're using Node v16 or above), run the development server at http://localhost:3000/fastfec via

```sh
npm run dev
```

Note that the website is served at a non-root path (`/fastfec`) to ensure [washingtonpost.com/fastfec](https://www.washingtonpost.com/fastfec/) works.

To build a static production version of the website in the `build/` folder:

```sh
npm run build
```
