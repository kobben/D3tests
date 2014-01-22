The D3 .filter() works fine like this, i.e. after the selection.append() :

       > shape = selectAll(".shapes).data(data).enter()
       >
       >    .append("someSVGelements")
       >
       >    .filter()
       >
       >    .attr ... create elements

But it means that for every data instance that  NOT complies to the filter condition, an empty element, eg.

       >
       >   <circle></circle>
       >

gets created...
