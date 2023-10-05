//BONUS CHALLENGE SOLVED

const express = require("express");
const app = express();
const port = 3000;
const { Curl } = require("node-libcurl");
const la = require("lodash");
const modelObj = { blogData: {} }; //To store the fetched results

//FUNCTION PERFORMS ANALYZATION
function analyze(blogData) {
  const totalBlogs = la.size(blogData.blogs);
  const titleOfLongestBlog = la.maxBy(
    blogData.blogs,
    (blog) => blog.title.length
  ).title;
  const blogsWithPiracy = la.size(
    la.filter(blogData.blogs, (blog) =>
      blog.title.toLowerCase().includes("privacy")
    )
  );
  const uniqueTitles = la
    .uniqBy(blogData.blogs, "title")
    .map((blog) => blog.title);

  return {
    totalBlogs,
    titleOfLongestBlog,
    blogsWithPiracy,
    uniqueTitles,
  };
}

//FUNCTION PERFORMS SEARCH BASED ON A QUERY
function search(query) {
  const results = modelObj.blogData.blogs.filter((blog) =>
    blog.title.toLowerCase().includes(query.toLowerCase())
  );

  return { results };
}

//BONUS CHALLENGE
//60 seconds caching time
const memoizedAnalyzation = la.memoize(analyze, (blogData) => blogData, 60000);
const memoizedSearch = la.memoize(search, (query) => query, 60000);

//DATA RETRIEVAL
app.get("/api/blog-stats", (_, res) => {
  const curl = new Curl();
  curl.setOpt("SSL_VERIFYPEER", false);
  curl.setOpt(
    Curl.option.URL,
    "https://intent-kit-16.hasura.app/api/rest/blogs"
  );
  curl.setOpt(Curl.option.HTTPHEADER, [
    "x-hasura-admin-secret:32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6",
  ]);

  curl.on("end", (statusCode, data) => {
    const blogData = JSON.parse(data);
    // res.json({ blogStats: blogData });
    modelObj.blogData = blogData;

    const results = memoizedAnalyzation(blogData);

    res.json(results);

    curl.close();
  });

  curl.on("error", (err) => {
    console.error("Curl error:", err);
    res.status(500).json({ error: "Error fetching blog data" });

    curl.close();
  });

  curl.perform();
});

//SEARCH ENDPOINT
app.get("/api/blog-search", (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter required" });
  }

  const results = memoizedSearch(query);

  return res.json(results);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
