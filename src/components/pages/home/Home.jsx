import Hero from "./hero/Hero";
import MostNew from "./mostnew/MostNew";
import Shop from "./shop/Shop";
import NewsPreview from "./NewsPreview/NewsPreview";
import EventsPreview from "./EventsPreview/EventsPreview";

const Home = () => {
  return (
    <div>
      <Hero />

      <MostNew />
      
      <NewsPreview />


      <Shop />
      <EventsPreview />
    </div>
  );
};

export default Home;