import logoImg from "../../../assets/logo.png";
import {
  FaBookOpen,
  FaLayerGroup,
  FaShoppingCart,
  FaUserCircle,
  FaHeart,
  FaSearch,
  FaStore,
  FaExchangeAlt,
  FaRegClock,
  FaTrashAlt,
  FaPlus,
  FaMinus,
  FaCheckCircle,
  FaStar,
  FaLock,
  FaUserPlus,
  FaPen,
  FaStream,
  FaShare,
  FaInfo,
  FaMoneyBill,
  FaRegCircle,
  FaHandshake,
  FaPercent,
  FaUserCheck,
  FaClock,
  FaCalculator,
  FaInfoCircle,
  FaBook,
} from "react-icons/fa";
import { GrSystem } from "react-icons/gr";
import { SiBookstack } from "react-icons/si";
import { BsFileImage } from "react-icons/bs";
import { FaDice } from "react-icons/fa6";

import "./help.scss";
import { FaHeartCirclePlus, FaPerson } from "react-icons/fa6";
import { IoWarningOutline } from "react-icons/io5";
import { RiAuctionFill } from "react-icons/ri";
import SupportChat from "../../support/SupportChat";

export default function HelpPage() {
  return (
    <>
      <SupportChat />

      <main className="help-page">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="help-hero">
        <div className="help-hero__glow help-hero__glow--one" />
        <div className="help-hero__glow help-hero__glow--two" />

        <div className="help-hero__content">
          <div className="help-hero__logo">
            <img
              src={logoImg}
              alt="Image"
              className="help-page-img dark:invert"
            />
          </div>

          {/* <div className="help-hero__eyebrow">
            HobbyFlow / GUIDE
          </div> */}
          <div className="help-hero__eyebrow">
            GUIDE
          </div>

          {/* <h1>
            HobbyFlow
            <span> GUIDE</span>
          </h1> */}

          <h1>
            HELP CENTER
          </h1>

          <p>
            Everything you need to know about books, collections, comics and board games your cart,
            orders, wishlist, profile and Premium features.
          </p>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="help-container">
        {/* =====================================================
            01 / GETTING STARTED
        ===================================================== */}

        <section className="help-section" id="getting-started">
          <div className="help-section__heading">
            <span>01</span>

            <div>
              <h2>Getting started</h2>

              <p>Start using HobbyFlow in a few simple steps.</p>
            </div>
          </div>

          <div className="help-card">
            <div className="help-card__icon">
              <FaInfo />
            </div>

            <h3>What is HobbyFlow?</h3>

            <p>
              HobbyFlow is a platform for discovering, exchanging and ordering
              books and book collections.
            </p>

            <p>
              You can browse available books, open their details, add them to
              your cart and complete an order through the checkout process.
            </p>

            <div className="help-highlight">
              <FaCheckCircle />

              <span>
                Create an account to access your personal profile and complete
                purchases.
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            02 / NAVIGATION
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>02</span>

            <div>
              <h2>Navigation</h2>

              <p>The main areas of HobbyFlow at a glance.</p>
            </div>
          </div>

          <div className="help-grid">
            <HelpCard
              icon={<FaPlus />}
              title="Create Post"
              text="Button for creating a post with a book, collections of books, comics and board games."
            />

            <HelpCard
              icon={<FaStream />}
              title="Menu"
              text="Mobile navigation"
            />

            <HelpCard
              icon={<FaSearch />}
              title="Search"
              text="Use search to quickly find a book, collection, takers or other available content."
            />

            <HelpCard
              icon={<FaShoppingCart />}
              title="Cart"
              text="Review selected items, change options and continue to checkout."
            />

            <HelpCard
              icon={<FaHeartCirclePlus />}
              title="Wishlist"
              text="Keep your personal list of books and things you are looking for."
            />

            <HelpCard
              icon={<FaShare />}
              title="Share"
              text="Share posts with others."
            />

            <HelpCard
              icon={<RiAuctionFill className="text-xl" />}
              title="Trade"
              text="Trade. Make your offer."
            />
            <HelpCard
              icon={<GrSystem className="text-xl" />}
              title="Themes"
              text="Change the color theme: light or dark default. It is set to the system default."
            />
            <HelpCard
              icon={<FaRegCircle className="text-xl" />}
              title="Account"
              text="Manage your personal account."
            />
          </div>
        </section>

        {/* =====================================================
            03 / ORDER FLOW
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>03</span>

            <div>
              <h2>How to place an order</h2>

              <p>The complete HobbyFlow ordering flow.</p>
            </div>
          </div>

          <div className="help-order">
            <div className="help-order__intro">
              <div className="help-order__icon">
                <FaInfo />
              </div>

              <div>
                <h3>From Selection to Checkout</h3>

                <p>
                  Follow these steps when you wish to order a book or
                  collection.
                </p>
              </div>
            </div>

            <div className="help-order__timeline">
              <div className="help-order__item">
                <span>01</span>

                <div>
                  <strong>Select Books</strong>

                  <p className="order-deals">
                    Open the book or collection you want to order.
                  </p>
                </div>
              </div>

              <div className="help-order__item">
                <span>02</span>

                <div>
                  <strong>Add to Cart</strong>

                  <p className="order-deals">
                    The selected book or collection will appear in your cart.
                  </p>
                </div>
              </div>

              <div className="help-order__item">
                <span>03</span>

                <div>
                  <strong>Review Cart Contents</strong>

                  <p className="order-deals">
                    Ensure the displayed total matches your selected items and
                    options.
                  </p>
                </div>
              </div>

              <div className="help-order__item">
                <span>04</span>

                <div>
                  <strong>Choose Buy or Lending</strong>

                  <p className="order-deals">
                    For supported books, choose the appropriate purchase option.
                  </p>
                </div>
              </div>

              <div className="help-order__item">
                <span>05</span>

                <div>
                  <strong>Proceed to Checkout</strong>

                  <p className="order-deals">
                    Continue to the checkout and payment page to complete the
                    order.
                  </p>
                </div>
              </div>
              <div className="help-order__item">
                <span>06</span>

                <div>
                  <strong>Checkout Completion</strong>

                  <p className="order-deals">
                    Once the checkout process is complete, the seller will
                    receive a notification regarding the purchase or lending
                    page.
                  </p>
                </div>
              </div>
              <div className="help-order__item">
                <span>07</span>

                <div>
                  <strong>Confirmation and Rejection</strong>
                  <p className="order-deals">
                    If the seller confirms the purchase or lending, you will
                    receive a confirmation notification. If it is rejected, you
                    will receive a rejection notification.
                  </p>
                </div>
              </div>
              <div className="help-order__item">
                <span>08</span>

                <div>
                  <strong>Details and Payment</strong>

                  <p className="order-deals pb-3">
                    <span className="order-deals-spn">For buyers:</span> After
                    confirmation, view your order in the "Purchase History"
                    section. There, you will find the seller's payment details
                    for the book and all order information. Once you make the
                    payment, the seller will ship the book or collection using
                    the details you provided during checkout (full name, phone
                    number, post office location, etc.)
                      <br />
                    When the book is returned to you, be sure to confirm the return in your order history; the book will then become active again and receive a rental rating.
                  </p>
                  <p className="order-deals">
                    <span className="order-deals-spn">For sellers:</span> After
                    payment is made, check the "Order History" section for the
                    buyer's details (full name, phone number, post office
                    location, etc.) and ship the book or collection to them.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="help-warning">
            <div className="help-warning__icon">
              <FaLock />
            </div>

            <div>
              <h3>Login is required for checkout</h3>

              <p>
                If you are not logged in when you try to proceed to checkout,
                HobbyFlow asks you to log in first.
              </p>
            </div>
          </div>
        </section>

        <section className="help-sections pt-6">
          <div className="help-section__heading">
          <span>03.1</span>
            <div>
              <h2>Order rules</h2>

              <p>Important restrictions applied by the cart.</p>
            </div>
          </div>

          <div className="help-important">
            <div className="help-important__item">
              <FaInfo />

              <div>
                <strong>One book per order</strong>

                <p>You can currently order only one book at a time.</p>
              </div>
            </div>

            <div className="help-important__item">
              <FaInfo />

              <div>
                <strong>One collection per order</strong>

                <p>You can currently order only one collection at a time.</p>
              </div>
            </div>

            <div className="help-important__item">
              <FaInfo />

              <div>
                <strong>Different types cannot be mixed</strong>

                <p>
                  Books, collections and shop products cannot currently be mixed
                  in the same order.
                </p>
              </div>
            </div>

            <div className="help-important__item">
              <FaInfo />

              <div>
                <strong>Shop quantities are adjustable</strong>

                <p>
                  Shop products can use the plus and minus quantity controls in
                  the cart.
                </p>
              </div>
            </div>
          </div>
        </section>

{/* =====================================================
    03.2 / AVAILABLE LISTING TYPES
===================================================== */}

<section className="help-sections pt-6">
  <div className="help-section__heading">
    <span>03.2</span>

    <div>
      <h2>Available Listing Types</h2>
      <p>
        HobbyFlow supports four distinct listing categories,
        allowing users to publish, discover and order
        different types of products through one marketplace.
      </p>
    </div>
  </div>

  <div className="help-important">

    {/* BOOKS */}
    <div className="help-important__item">
      <FaBook />

      <div>
        <strong>Books</strong>

        <p>
          Publish and discover individual books with
          detailed information, including author, genre,
          language, publication year, page count,
          condition, photographs and pricing.
        </p>

        <p className="mt-2">
          Depending on the seller's listing preferences,
          books may be available for purchase, rental,
          or both. Buyers can review the available
          options before placing an order.
        </p>
      </div>
    </div>

    {/* BOOK COLLECTIONS */}
    <div className="help-important__item">
      <SiBookstack />

      <div>
        <strong>Book Collections</strong>

        <p>
          Create and publish curated collections containing
          multiple books, such as complete series,
          selected volumes or themed editions.
          Each listing provides collection details,
          photographs, book information and a total price.
        </p>

        <p className="mt-2">
          Book collections are offered as a single
          purchase. Buyers order the entire collection
          rather than purchasing individual volumes
          from the listing.
        </p>
      </div>
    </div>

    {/* COMICS */}
    <div className="help-important__item">
      <BsFileImage />

      <div>
        <strong>Comics</strong>

        <p>
          Explore and publish individual comics,
          graphic novels and illustrated editions.
          Listings include relevant publication
          information, descriptions, condition,
          photographs and pricing details.
        </p>

        <p className="mt-2">
          Comics can be listed for purchase, rental,
          or both, depending on the seller's selected
          availability options.
        </p>
      </div>
    </div>

    {/* BOARD GAMES */}
    <div className="help-important__item">
      <FaDice />

      <div>
        <strong>Board Games</strong>

        <p>
          Discover and publish board games with
          detailed descriptions, photographs,
          category, number of players, estimated
          playing time, recommended age, language,
          condition and pricing information.
        </p>

        <p className="mt-2">
          Depending on the listing, board games
          may be available for purchase or rental,
          giving users flexibility when choosing
          how to enjoy a game.
        </p>
      </div>
    </div>

  </div>

  <div className="help-highlight mt-5">
    <FaCheckCircle />

    <span>
      All four categories are integrated into the
      HobbyFlow marketplace. Available purchasing and
      rental options depend on the product category
      and the seller's listing settings.
    </span>
  </div>
</section>

      {/* =====================================================
          04 / SHOPPING CART
      ===================================================== */}

        <section className="help-section help-cart">
          <div className="help-section__heading">
            <span>04</span>

            <div>
              <h2>Shopping cart</h2>

              <p>
                Review your items, manage quantities and prepare your order
                before checkout.
              </p>
            </div>
          </div>

          {/* =====================================================
      CART INTRO
  ===================================================== */}

          <div className="help-card">
            <div className="help-card__icon">
              <FaShoppingCart />
            </div>

            <h3>Your shopping cart</h3>

            <p>
              The shopping cart contains the books, collections or shop products
              you have selected for purchase.
            </p>

            <p>
              Before proceeding to checkout, carefully review the selected
              items, their prices, quantities and purchase options.
            </p>

            <div className="help-highlight">
              <FaCheckCircle />

              <span>
                Make sure that all selected items and quantities are correct
                before continuing to checkout.
              </span>
            </div>
          </div>

          {/* =====================================================
      CART ACTIONS
  ===================================================== */}

          <div className="help-grid help-cart__grid">
            <HelpCard
              icon={<FaShoppingCart />}
              title="Add items"
              text="Add books, collections or shop products to your cart before placing an order."
            />

            <HelpCard
              icon={<FaTrashAlt />}
              title="Remove items"
              text="Use the trash icon to remove an item that you no longer want to order."
            />

            <HelpCard
              icon={<FaPlus />}
              title="Increase quantity"
              text="Shop products can have their quantity increased directly from the cart."
            />

            <HelpCard
              icon={<FaMinus />}
              title="Decrease quantity"
              text="Use the minus button to reduce the quantity of shop products."
            />
          </div>

          {/* =====================================================
      SHOP ORDER
  ===================================================== */}

          <div className="help-card help-cart__payment">

            <h3>How do I place an order from our store?</h3>

            <p>
              To order items from the HobbyFlow shop, add the desired products to
              your cart and proceed through the checkout process.
            </p>

            <div className="help-cart__steps">
              <div className="help-cart__step">
                <span>01</span>

                <div>
                  <strong>Add products to your cart</strong>

                  <p>
                    Select the shop products you want to purchase and add them
                    to your shopping cart.
                  </p>
                </div>
              </div>

              <div className="help-cart__step">
                <span>02</span>

                <div>
                  <strong>Review your order</strong>

                  <p>
                    Check the products, quantities and total amount before
                    submitting the order.
                  </p>
                </div>
              </div>

              <div className="help-cart__step">
                <span>03</span>

                <div>
                  <strong>Place the order</strong>

                  <p>
                    Complete the order form and make sure all required
                    information has been entered correctly.
                  </p>
                </div>
              </div>

              <div className="help-cart__step">
                <span>04</span>

                <div>
                  <strong>Make the payment</strong>

                  <p>
                    Complete the payment using the available payment method. If
                    required, include your order number in the payment
                    description.
                  </p>
                </div>
              </div>

              <div className="help-cart__step">
                <span>05</span>

                <div>
                  <strong>Order processing</strong>

                  <p>
                    Once HobbyFlow receives notification of your order and
                    payment, the items can be prepared for shipment.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
      IMPORTANT
  ===================================================== */}

          <div className="help-warning help-cart__warning">
            <div className="help-warning__icon">
              <FaInfoCircle />
            </div>

            <div>
              <h3>Before placing your order</h3>

              <ul>
                <li>Check that all products and quantities are correct.</li>

                <li>
                  Make sure all fields in the order form are filled out
                  correctly.
                </li>

                <li>Check the total order amount before making payment.</li>

                <li>
                  Include the order number in the payment description when this
                  option is available.
                </li>

                <li>
                  After payment, HobbyFlow processes the order after receiving
                  confirmation of the order and payment.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================
            05 / PUBLISHING BOOKS & COLLECTIONS
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>05</span>

            <div>
              <h2>Publishing Books & Collections</h2>

              <p>
                Learn how to create, publish, edit and manage your book listings
                and book collections on HobbyFlow.
              </p>
            </div>
          </div>

          {/* PREMIUM REQUIREMENT */}

          <div className="help-warning help-publishing mb-3">
            <div className="help-warning__icon">
              <FaLock />
            </div>

            <div>
              <h3>Publishing is available to Premium users</h3>

              <p>
                Only users with an active Premium subscription can publish books
                and book collections on HobbyFlow.
              </p>

              <div className="help-highlight">
                <FaCheckCircle />

                <span>
                  An active Premium subscription is required to publish a book
                  or collection.
                </span>
              </div>
            </div>
          </div>

          {/* SINGLE BOOK */}

          <div className="help-card mb-3">
            <h3>How to publish a book</h3>

            <p>
              To create a book listing, open the book publishing form and
              provide the required information about the book.
            </p>

            <ol className="help-steps">
              <li>
                <strong>Book title</strong>
                <span>Enter the name of the book.</span>
              </li>

              <li>
                <strong>Author</strong>
                <span>Enter the author's name.</span>
              </li>

              <li>
                <strong>Genre</strong>
                <span>Select the genre that best describes the book.</span>
              </li>

              <li>
                <strong>Publication year</strong>
                <span>Enter the year in which the book was published.</span>
              </li>

              <li>
                <strong>Number of pages</strong>
                <span>Enter the total number of pages.</span>
              </li>

              <li>
                <strong>Language</strong>
                <span>Select the language of the book.</span>
              </li>

              <li>
                <strong>Book condition</strong>
                <span>
                  Select the condition that accurately describes the physical
                  state of the book.
                </span>
              </li>

              <li>
                <strong>Price</strong>
                <span>Set the selling price in Ukrainian hryvnia (₴).</span>
              </li>

              <li>
                <strong>Selling options</strong>
                <span>
                  Choose whether the book is available for sale only or for both
                  sale and lending.
                </span>
              </li>

              <li>
                <strong>Description</strong>
                <span>
                  Add useful information about the book, edition, condition,
                  notable details or other relevant information.
                </span>
              </li>

              <li>
                <strong>Photos</strong>
                <span>
                  Upload between 3 and 6 photos of the book. Clear photos help
                  other users evaluate the listing.
                </span>
              </li>
            </ol>

            <div className="help-highlight">
              <FaInfoCircle />

              <span>
                A book cannot be published until all required fields are
                completed and at least 3 photos have been added.
              </span>
            </div>
          </div>

          {/* LENDING */}

          <div className="help-card mb-3">
            <h3>Sale & Lending</h3>

            <p>
              When publishing an individual book, you can choose between two
              selling options:
            </p>

            <ul className="help-list">
              <li>
                <strong>Sale only</strong> — the book is available only for
                purchase.
              </li>

              <li>
                <strong>Sale + Lending</strong> — the book can be purchased or
                borrowed.
              </li>
            </ul>

            <p>
              If lending is enabled, you must specify the lending price and
              lending period.
            </p>

            <div className="help-highlight">
              <FaInfoCircle />

              <span>
                Lending is available for individual books. Book collections
                cannot be published for lending.
              </span>
            </div>
          </div>

          {/* COLLECTION */}

          <div className="help-card mb-3">
            <h3>Book Collections</h3>

            <p>Order several related books as one collection.</p>

            <div className="help-card">
              <div className="help-card__icon">
                <FaLayerGroup />
              </div>

              <h3>How collections work</h3>

              <p>
                A collection groups several books together and can be added to
                the cart as a single purchasable item.
              </p>

              <p>
                Open the collection to inspect its books and available
                information before adding it to your cart.
              </p>

              <div className="help-highlight">
                <FaCheckCircle />

                <span>
                  The cart also displays how many books are included in the
                  collection.
                </span>
              </div>
            </div>

            <div className="help-warning">
              <div>
                <h3>Collection order limitation</h3>

                <p>
                  You can currently place an order with only one collection at a
                  time.
                </p>

                <p>
                  Two different collections cannot be included in the same
                  order.
                </p>

                <h3>How to publish a book collection</h3>

                <p>
                  A collection allows you to sell several books together as one
                  listing. A collection must contain at least 2 books and can
                  contain up to 20 books.
                </p>
              </div>
            </div>

            <h4>Collection information</h4>

            <ul className="help-list">
              <li>
                <strong>Collection name</strong> — the name of the collection.
              </li>

              <li>
                <strong>Series name</strong> — optional series or franchise
                name.
              </li>

              <li>
                <strong>Main author</strong> — optional main author.
              </li>

              <li>
                <strong>Genre</strong> — select the collection genre.
              </li>

              <li>
                <strong>Completeness</strong> — specify whether the collection
                is complete or represents only part of the complete collection.
              </li>

              <li>
                <strong>Total price</strong> — the price for all books in the
                collection together.
              </li>

              <li>
                <strong>Description</strong> — describe the collection,
                editions, condition, special features and other important
                details.
              </li>
            </ul>

            <h4>Books inside the collection</h4>

            <p>
              Each book in the collection has its own information and photos.
            </p>

            <ul className="help-list">
              <li>Book title</li>

              <li>Author</li>

              <li>Publication year</li>

              <li>Number of pages</li>

              <li>Language</li>

              <li>Book condition</li>

              <li>Book description</li>

              <li>Up to 3 photos per book</li>
            </ul>

            <div className="help-highlight">
              <FaCheckCircle />

              <span>
                Every collection must contain at least 2 books. You can add up
                to 20 books to one collection.
              </span>
            </div>
          </div>

          {/* COMPLETENESS */}

          <div className="help-card mb-3">
            <h3>Collection completeness</h3>

            <p>
              When creating a collection, you can specify how much of the
              complete collection is included.
            </p>

            <ul className="help-list">
              <li>
                <strong>Full collection</strong> — complete collection.
              </li>

              <li>
                <strong>Half collection — 1/2</strong> — approximately half of
                the complete collection.
              </li>

              <li>
                <strong>Third collection — 1/3</strong> — approximately one
                third of the complete collection.
              </li>

              <li>
                <strong>Two thirds — 2/3</strong> — approximately two thirds of
                the complete collection.
              </li>

              <li>
                <strong>Part 1</strong> — first part.
              </li>

              <li>
                <strong>Part 2</strong> — second part.
              </li>

              <li>
                <strong>Part 3</strong> — third part.
              </li>

              <li>
                <strong>Custom</strong> — specify the exact completeness
                manually.
              </li>
            </ul>
          </div>

          {/* EDIT & DELETE */}

          <div className="help-card mb-3">
            <h3>Editing and deleting publications</h3>

            <p>
              After publishing, you can continue managing your own book listings
              and collections.
            </p>

            <div className="help-feature-grid">
              <div className="help-feature-card">
                <FaPen />

                <h4>Edit a publication</h4>

                <p>
                  You can edit the information of your published book or
                  collection when you need to update details, descriptions,
                  prices, photos or other information.
                </p>
              </div>

              <div className="help-feature-card">
                <FaTrashAlt />

                <h4>Delete a publication</h4>

                <p>
                  You can delete your own book listings and collections when you
                  no longer want them to be available on HobbyFlow.
                </p>
              </div>
            </div>

            <div className="help-highlight">
              <FaInfoCircle />

              <span>
                Editing and deleting are available for your own publications.
                Other users cannot modify or delete your listings.
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            06 / BOOK CONDITIONS
        ===================================================== */}

        <section className="help-section help-conditions">
          <div className="help-section__heading">
            <span>06</span>

            <div>
              <h2>Book Conditions</h2>

              <p>
                Understand the condition of a book before making a purchase.
              </p>
            </div>
          </div>

          <div className="help-card">
            <div className="help-card__icon">
              <FaInfo />
            </div>

            <h3>How book condition works</h3>

            <p>
              Every book can have a condition that describes its current
              physical state and the visible signs of use.
            </p>

            <p>
              The condition helps you understand how well the pages, cover and
              binding have been preserved. Always check the available photos and
              description for additional details before purchasing.
            </p>
          </div>

          <div className="help-conditions__grid">
            <div className="help-condition-card help-condition-card--very-good">
              <div className="help-condition-card__top">
                <span className="help-condition-card__dot" />

                <span className="help-condition-card__label">Very Good</span>
              </div>

              <h3>Minimal signs of use</h3>

              <p>
                Minimal signs of use. Pages, cover and binding are very well
                preserved.
              </p>

              <div className="help-condition-card__example">
                <strong>What to expect</strong>

                <span>
                  The book is in very good overall condition with only minor
                  visible signs of previous use.
                </span>
              </div>
            </div>

            <div className="help-condition-card help-condition-card--good">
              <div className="help-condition-card__top">
                <span className="help-condition-card__dot" />

                <span className="help-condition-card__label">Good</span>
              </div>

              <h3>Light signs of use</h3>

              <p>
                Light signs of use. Minor wear may be visible, but there are no
                significant defects.
              </p>

              <div className="help-condition-card__example">
                <strong>What to expect</strong>

                <span>
                  Some normal signs of handling may be visible, while the
                  overall condition remains good.
                </span>
              </div>
            </div>

            <div className="help-condition-card help-condition-card--poor">
              <div className="help-condition-card__top">
                <span className="help-condition-card__dot" />

                <span className="help-condition-card__label">Poor</span>
              </div>

              <h3>Noticeable wear</h3>

              <p>
                Noticeable wear, marks or minor defects are present. The book
                remains usable.
              </p>

              <div className="help-condition-card__example">
                <strong>What to expect</strong>

                <span>
                  The book may have visible signs of use, marks or other minor
                  imperfections.
                </span>
              </div>
            </div>

            <div className="help-condition-card help-condition-card--very-poor">
              <div className="help-condition-card__top">
                <span className="help-condition-card__dot" />

                <span className="help-condition-card__label">Very Poor</span>
              </div>

              <h3>Heavy wear or damage</h3>

              <p>
                Heavy wear or significant damage. Important defects should be
                clearly visible in the photos.
              </p>

              <div className="help-condition-card__example">
                <strong>What to expect</strong>

                <span>
                  The book may have substantial wear or damage that noticeably
                  affects its appearance.
                </span>
              </div>
            </div>
          </div>

          <div className="help-warning help-conditions__warning">
            <div className="help-warning__icon">
              <FaInfo />
            </div>

            <div>
              <h3>Always check the photos</h3>

              <p>
                The condition label gives you a general idea of the book's
                physical state. For a more accurate understanding, review the
                book photos and description before placing an order.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            07 / PROFILE
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>07.0</span>

            <div>
              <h2>Profile</h2>

              <p>Manage your personal HobbyFlow account.</p>
            </div>
          </div>

          <div className="help-grid">
            <HelpCard
              icon={<FaInfo />}
              title="Account"
              text="Open your profile to manage your personal HobbyFlow settings."
            />

            <HelpCard
              icon={<FaInfo />}
              title="Wishlist"
              text="Edit and save your current wishlist directly from the profile."
            />

            <HelpCard
              icon={<FaInfo />}
              title="Avatar"
              text="Upload a profile picture and update your account appearance."
            />

            <HelpCard
              icon={<FaInfo />}
              title="Avatar cooldown"
              text="Avatar changes are limited to once every 7 days."
            />

            <HelpCard
              icon={<FaInfo />}
              title="Premium status"
              text="Your profile can display an active Premium status and remaining days."
            />
          </div>
        </section>
        {/* =====================================================
    03.3 / TAKER RATING & TRUST
===================================================== */}

<section className="help-sections pt-6">
  <div className="help-section__heading">
    <span>07.1</span>

    <div>
      <h2>Taker Rating & Trust</h2>
      <p>
        Understand how completed transactions build a
        Taker's reputation and credibility on HobbyFlow.
      </p>
    </div>
  </div>

  <div className="help-card mb-3">
    <div className="help-card__icon">
      <FaStar />
    </div>

    <h3>What is the Taker Rating?</h3>

    <p>
      The Taker Rating is a reputation indicator that
      reflects a seller's successfully completed
      transactions on HobbyFlow.
    </p>

    <p className="mt-2">
      Every successful sale or completed rental contributes
      to the seller's transaction history and helps build
      their reputation within the marketplace.
    </p>

    <div className="help-highlight mt-4">
      <FaCheckCircle />
      <span>
        The more successfully completed transactions a
        Taker has, the stronger their reputation and
        demonstrated experience on HobbyFlow.
      </span>
    </div>
  </div>

  <div className="help-important">
    <div className="help-important__item">
      <FaShoppingCart />

      <div>
        <strong>Successful Sales</strong>
        <p>
          Completed purchases contribute to a Taker's
          transaction history and help demonstrate
          their experience as a seller.
        </p>
      </div>
    </div>

    <div className="help-important__item">
      <FaRegClock />

      <div>
        <strong>Completed Rentals</strong>
        <p>
          Successfully completed rentals also contribute
          to the seller's reputation. A rental is considered
          complete when the item has been returned and
          its return has been confirmed.
        </p>
      </div>
    </div>

    <div className="help-important__item">
      <FaStar />

      <div>
        <strong>Building Trust</strong>
        <p>
          A higher rating helps buyers identify Takers
          with more completed transactions and an
          established history on the platform.
        </p>
      </div>
    </div>

    <div className="help-important__item">
      <FaUserCheck />

      <div>
        <strong>Choosing a Taker</strong>
        <p>
          Before placing an order, buyers can consider
          the seller's rating alongside product details,
          photographs, condition and other available
          information.
        </p>
      </div>
    </div>
  </div>

  <div className="help-warning mt-5">
    <div className="help-warning__icon">
      <FaInfoCircle />
    </div>

    <div>
      <h3>Rating and transaction reliability</h3>
      <p>
        A higher Taker Rating indicates a more established
        transaction history, but it does not guarantee
        the outcome of future orders. Buyers should
        always review listing details and communicate
        with sellers when necessary.
      </p>
    </div>
  </div>
</section>

        {/* =====================================================
            08 / PREMIUM
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>08</span>

            <div>
              <h2>Premium</h2>

              <p>Additional account functionality available with Premium.</p>
            </div>
          </div>

          <div className="help-premium">
            <div className="help-premium__icon">
              <FaCheckCircle />
            </div>

            <div>
              <h3>Premium account</h3>

              <p>
                When your Premium access is active, HobbyFlow can display its
                current status directly in your profile.
              </p>

              <div className="help-premium__status">
                <span>Premium</span>
                <strong>Active</strong>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            09 / SEARCH
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>09</span>

            <div>
              <h2>Search</h2>

              <p>Find what you need faster.</p>
            </div>
          </div>

          <div className="help-card">
            <div className="help-card__icon">
              <FaSearch />
            </div>

            <h3>Using search</h3>

            <p>
              Use the search field to quickly find available content instead of
              browsing everything manually.
            </p>

            <p>
              When you find the required item, open its details and continue
              with the normal cart flow.
            </p>
          </div>
        </section>
        {/* =====================================================
            10 / TRADING
        ===================================================== */}

        <section className="help-section help-trading">
          <div className="help-section__heading">
            <span>10</span>

            <div>
              <h2>Trading</h2>

              <p>
                Negotiate the price of books and book collections directly with
                sellers.
              </p>
            </div>
          </div>

          <div className="help-card">
            <div className="help-card__icon">
              <FaHandshake />
            </div>

            <h3>Make an Offer</h3>

            <p>
              Trading allows you to offer a lower price for a book or book
              collection instead of purchasing it at the original listed price.
            </p>

            <p>
              Enter the amount you are willing to pay and send your offer to the
              seller. The seller can then review your offer and decide whether
              to accept or reject it. As soon as the seller accepts the
              counteroffer, you will receive a notification of acceptance; you
              can then proceed to checkout, add the item to your cart at the new
              price, and complete the purchase.
            </p>
          </div>

          <div className="help-trading__grid">
            {/* =====================================================
        HOW IT WORKS
    ===================================================== */}

            <div className="help-feature-card">
              <div className="help-feature-card__icon">
                <FaHandshake />
              </div>

              <div>
                <h3>How trading works</h3>

                <p>
                  Open a book or collection and select
                  <strong> Make an Offer</strong>. Enter the price you would
                  like to offer and send it to the seller.
                </p>
              </div>
            </div>

            {/* =====================================================
        40% LIMIT
    ===================================================== */}

            <div className="help-feature-card">
              <div className="help-feature-card__icon">
                <FaPercent />
              </div>

              <div>
                <h3>Up to 40% off</h3>

                <p>
                  You can negotiate up to
                  <strong> 40% below the original price</strong>. Your offer
                  cannot be lower than 60% of the listed price.
                </p>
              </div>
            </div>

            {/* =====================================================
        SELLER DECISION
    ===================================================== */}

            <div className="help-feature-card">
              <div className="help-feature-card__icon">
                <FaUserCheck />
              </div>

              <div>
                <h3>Seller decides</h3>

                <p>
                  After you send an offer, the seller receives it and can review
                  the proposed price before deciding whether to accept or reject
                  it.
                </p>
              </div>
            </div>

            {/* =====================================================
        PENDING OFFERS
    ===================================================== */}

            <div className="help-feature-card">
              <div className="help-feature-card__icon">
                <FaClock />
              </div>

              <div>
                <h3>Active offers</h3>

                <p>
                  You can have only one active pending offer for the same book
                  or collection at a time.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================
      PRICE EXAMPLE
  ===================================================== */}

          <div className="help-trading__example">
            <div className="help-trading__example-header">
              <div className="help-trading__example-icon">
                <FaCalculator />
              </div>

              <div>
                <h3>Example</h3>

                <p>See how the minimum offer is calculated.</p>
              </div>
            </div>

            <div className="help-trading__price">
              <div className="help-trading__price-item">
                <span>Original price</span>
                <strong>1,000 ₴</strong>
              </div>

              <div className="help-trading__operator">× 60%</div>

              <div className="help-trading__price-item">
                <span>Minimum offer</span>
                <strong>600 ₴</strong>
              </div>
            </div>

            <p className="help-trading__example-note">
              For a book priced at 1,000 ₴, the lowest possible offer is 600 ₴.
              Any offer between 600 ₴ and 999 ₴ can be submitted.
            </p>
          </div>

          {/* =====================================================
      RULES
  ===================================================== */}

          <div className="help-warning help-trading__warning">
            <div className="help-warning__icon">
              <FaInfoCircle />
            </div>

            <div>
              <h3>Trading rules</h3>

              <ul>
                <li>You must be logged in to make an offer.</li>

                <li>
                  You cannot make an offer on your own book or collection.
                </li>

                <li>The offer must be at least 60% of the original price.</li>

                <li>The offer must be lower than the original price.</li>

                <li>
                  You cannot create another offer while an existing offer for
                  the same item is still pending.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================
            11 / WISHLIST
        ===================================================== */}

        <section className="help-section">
          <div className="help-section__heading">
            <span>11</span>

            <div>
              <h2>Wishlist</h2>

              <p>Keep track of books you are looking for.</p>
            </div>
          </div>

          <div className="help-card">
            <div className="help-card__icon">
              <FaHeartCirclePlus />
            </div>

            <h3>Your personal wishlist</h3>

            <p>
              The Wishlist area allows you to save information about books you
              are interested in or looking for.
            </p>

            <p>
              You can edit the wishlist text from your profile and save the
              changes directly to your account.
            </p>

            <div className="help-highlight">
              <FaCheckCircle />

              <span>Wishlist changes are saved to your HobbyFlow profile.</span>
            </div>
          </div>
        </section>

        {/* =====================================================
            12 / FAQ
        ===================================================== */}

        <section className="help-section help-section--last">
          <div className="help-section__heading">
            <span>12</span>

            <div>
              <h2>FAQ</h2>

              <p>Quick answers to common HobbyFlow questions.</p>
            </div>
          </div>

          <div className="help-faq">
            <details>
              <summary>Can I checkout without logging in?</summary>

              <p>
                No. HobbyFlow requires you to be logged in when you proceed to
                checkout.
              </p>
            </details>

            <details>
              <summary>Can I buy and lend a book?</summary>

              <p>
                For books where lending is available, you can choose between Buy
                and Lending in the cart.
              </p>
            </details>

            <details>
              <summary>Can I order several books at once?</summary>

              <p>The current cart rules allow only one book per order.</p>
            </details>

            <details>
              <summary>Can I order several collections together?</summary>

              <p>
                No. The current checkout rules allow only one collection per
                order.
              </p>
            </details>

            <details>
              <summary>Can I mix a book and a collection?</summary>

              <p>
                No. Books, collections and shop products cannot currently be
                mixed in the same order.
              </p>
            </details>

            <details>
              <summary>Can I change a shop quantity?</summary>

              <p>
                Yes. Use the plus and minus controls directly in the shopping
                cart.
              </p>
            </details>

            <details>
              <summary>How do I remove something from the cart?</summary>

              <p>Press the trash icon next to the item you want to remove.</p>
            </details>

            <details>
              <summary>Can I change my avatar whenever I want?</summary>

              <p>Avatar changes are limited to once every 7 days.</p>
            </details>

            <details>
              <summary>Where can I edit my wishlist?</summary>

              <p>
                Open your Profile and edit the Wishlist section. Save the
                changes when finished.
              </p>
            </details>
          </div>
        </section>
      </div>
  </main>
  </>
  );
}

/* =========================================================
   REUSABLE CARD
========================================================= */

function HelpCard({ icon, title, text }) {
  return (
    <div className="help-feature-card">
      <div className="help-feature-card__icon">{icon}</div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  );
}